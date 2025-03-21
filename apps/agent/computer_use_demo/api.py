"""
API server for Computer Use Demo that allows sending prompts to the agent
"""

import asyncio
import os
import traceback
from typing import List, Optional, Dict, Any, Union

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from anthropic import RateLimitError
from anthropic.types.beta import BetaContentBlockParam, BetaMessageParam

from computer_use_demo.loop import (
    APIProvider,
    sampling_loop,
    update_used_tools,
)
from computer_use_demo.tools import ToolResult, ToolVersion

PROVIDER_TO_DEFAULT_MODEL_NAME: dict[str, str] = {
    APIProvider.ANTHROPIC: "claude-3-7-sonnet-20250219",
    APIProvider.BEDROCK: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    APIProvider.VERTEX: "claude-3-5-sonnet-v2@20241022",
}

app = FastAPI(title="Computer-Use-Demo API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str
    content: Union[str, List[Dict[str, Any]]]

class PromptRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = "claude-3-7-sonnet-20250219"
    provider: Optional[str] = APIProvider.ANTHROPIC
    tool_version: Optional[str] = "computer_use_agentkit"
    max_tokens: Optional[int] = 4096
    system_prompt_suffix: Optional[str] = ""
    only_n_most_recent_images: Optional[int] = 3
    thinking_budget: Optional[int] = None
    token_efficient_tools_beta: Optional[bool] = False
    maintain_conversation: Optional[bool] = False

class ToolResultResponse(BaseModel):
    type: str
    output: Any
    tool_id: str

class PromptResponse(BaseModel):
    response: List[BetaContentBlockParam]
    tool_results: List[ToolResultResponse] = []
    messages: List[Dict[str, Any]] = []

# Store conversations per client
conversations = {}

# Collect tool outputs and blocks
collected_responses = []
collected_tool_results = {}

def output_callback(block: BetaContentBlockParam):
    """Collect output blocks from the model response"""
    collected_responses.append(block)

def tool_output_callback(tool_output: ToolResult, tool_id: str):
    """Collect tool outputs"""
    collected_tool_results[tool_id] = tool_output

def api_response_callback(request, response, error):
    """Handle API responses and errors"""
    if error:
        print(f"API Error: {error}")

@app.exception_handler(RateLimitError)
async def rate_limit_exception_handler(request: Request, exc: RateLimitError):
    """Custom exception handler for rate limit errors"""
    retry_after = exc.response.headers.get("retry-after", "unknown")
    return JSONResponse(
        status_code=429,
        content={
            "error": f"Rate limit exceeded. Retry after {retry_after} seconds.",
            "detail": exc.message
        },
    )

async def get_api_key(provider: str = APIProvider.ANTHROPIC):
    """Get the appropriate API key based on provider"""
    if provider == APIProvider.ANTHROPIC:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="ANTHROPIC_API_KEY environment variable not set"
            )
        return api_key
    elif provider == APIProvider.BEDROCK:
        # For Bedrock, we don't need an API key - credentials are handled by boto3
        # But we should verify AWS credentials are available
        try:
            import boto3
            if not boto3.Session().get_credentials():
                raise HTTPException(
                    status_code=500,
                    detail="AWS credentials not found. Please configure AWS credentials."
                )
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="boto3 not installed. Please install it to use Bedrock."
            )
        return None
    elif provider == APIProvider.VERTEX:
        # For Vertex, check environment variables
        if not os.environ.get("CLOUD_ML_REGION"):
            raise HTTPException(
                status_code=500,
                detail="CLOUD_ML_REGION environment variable not set"
            )
        try:
            import google.auth
            from google.auth.exceptions import DefaultCredentialsError
            try:
                google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
            except DefaultCredentialsError:
                raise HTTPException(
                    status_code=500,
                    detail="Google Cloud credentials not found"
                )
        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="Google Auth not installed. Please install it to use Vertex."
            )
        return None
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported provider: {provider}"
        )

@app.post("/api/prompt", response_model=PromptResponse)
async def send_prompt(request: PromptRequest, api_key: str = Depends(get_api_key)):
    """
    Send a prompt to the agent and receive a response with tool outputs
    """
    try:
        # Reset collectors
        collected_responses.clear()
        collected_tool_results.clear()
        
        # Get or create conversation history
        client_id = request.messages[0].content if isinstance(request.messages[0].content, str) else id(request)
        if request.maintain_conversation and client_id in conversations:
            formatted_messages = conversations[client_id]
        else:
            formatted_messages = []
        
        # Add new messages if starting fresh or appending to history
        if not formatted_messages or not request.maintain_conversation:
            # Convert incoming messages to the format expected by the sampling_loop
            for msg in request.messages:
                if isinstance(msg.content, str):
                    formatted_messages.append(
                        BetaMessageParam(role=msg.role, content=msg.content)
                    )
                else:
                    # Handle complex content (lists of blocks)
                    formatted_messages.append(
                        BetaMessageParam(role=msg.role, content=msg.content)
                    )
        else:
            # Append only the last message from the request to the existing conversation
            last_msg = request.messages[-1]
            if isinstance(last_msg.content, str):
                formatted_messages.append(
                    BetaMessageParam(role=last_msg.role, content=last_msg.content)
                )
            else:
                formatted_messages.append(
                    BetaMessageParam(role=last_msg.role, content=last_msg.content)
                )

        # Set model based on provider if not explicitly specified
        model = request.model
        if not model:
            model = PROVIDER_TO_DEFAULT_MODEL_NAME.get(request.provider, "claude-3-7-sonnet-20250219")

        # Run the sampling loop (asynchronously, but wait for it to complete)
        updated_messages = await sampling_loop(
            model=model,
            provider=request.provider,
            system_prompt_suffix=request.system_prompt_suffix,
            messages=formatted_messages,
            output_callback=output_callback,
            tool_output_callback=tool_output_callback,
            api_response_callback=api_response_callback,
            api_key=api_key,
            max_tokens=request.max_tokens,
            tool_version=request.tool_version,
            thinking_budget=request.thinking_budget,
            token_efficient_tools_beta=request.token_efficient_tools_beta,
            only_n_most_recent_images=request.only_n_most_recent_images,
        )
        
        # Update conversation history if maintaining state
        if request.maintain_conversation:
            conversations[client_id] = updated_messages

        # Format tool results for response
        tool_results = []
        for tool_id, tool_result in collected_tool_results.items():
            tool_results.append(
                ToolResultResponse(
                    type=tool_result.type,
                    output=tool_result.output,
                    tool_id=tool_id
                )
            )

        return PromptResponse(
            response=collected_responses,
            tool_results=tool_results,
            messages=[dict(m) for m in updated_messages]  # Return updated conversation
        )
    
    except RateLimitError:
        # Let the exception handler deal with this
        raise
    except Exception as e:
        print(f"API Error: {e}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=str(e)
        )

@app.delete("/api/conversation/{client_id}")
async def delete_conversation(client_id: str):
    """Delete a conversation history"""
    if client_id in conversations:
        del conversations[client_id]
        return {"status": "success", "message": f"Conversation {client_id} deleted"}
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation with ID {client_id} not found"
        )

def start_api_server(host="0.0.0.0", port=8000):
    """Start the API server"""
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    start_api_server() 