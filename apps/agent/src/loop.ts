// Listen to the queue for new messages
// Get the last message from the queue
// Execute the message
// Update the state
// Send the response

import { executePrompt } from '.';

export const loop = async () => {
  // fetch current task from db
  const prompt =
    'On the computer, go to dexscreener and look at the top Base coins';

  // update task to in progress

  const response = await executePrompt(prompt, {
    host: 'computer',
    port: 5900,
  });
  console.log(response);
};

loop();
