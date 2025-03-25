import { cn } from '@/lib/utils';
import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';

// Helper function to create canvas-based texture for rounded logos
const createRoundedLogoTexture = (imageUrl) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw rounded rectangle (almost circular)
  context.beginPath();
  const radius = canvas.width / 2;
  context.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);

  // Load image onto canvas
  const image = new Image();
  image.crossOrigin = 'Anonymous';
  image.onload = () => {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
  };
  image.src = imageUrl;

  return texture;
};

// Enhanced sponsor dock component
const SponsorDock = ({ className }: { className?: string }) => {
  const mountRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize Three.js scene
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Append renderer to div
    mountRef.current.appendChild(renderer.domElement);

    // randomly add or remove up to 2% should return a number between -0.02 and 0.02 to be multiplied by the orbitPhase
    const getRandomOffset = () => {
      return Math.random() - 0.02; // should return a number between -0.02 and 0.02
    };

    // Logo configurations with circular orbit parameters
    const logoConfigs = [
      {
        scale: 1.1,
        name: 'Coinbase',
        imageUrl: '/coinbase.png',
        orbitRadius: 1.2 + getRandomOffset(),
        orbitPhase: 0 + getRandomOffset(), // Starting phase in radians
      },
      {
        scale: 1.2,
        name: 'ETH Global',
        imageUrl: '/ethglobal-alt.jpeg',
        orbitRadius: 1.2 + getRandomOffset(),
        orbitPhase: Math.PI / 2 + getRandomOffset(), // 90 degrees offset
      },
      {
        scale: 0.9,
        name: 'Nethermind',
        imageUrl: '/nethermind.png',
        orbitRadius: 1.2 + getRandomOffset(),
        orbitPhase: Math.PI + getRandomOffset(), // 180 degrees offset
      },
      {
        scale: 1.1,
        name: 'Privy',
        imageUrl: '/privy.png',
        orbitRadius: 1.2 + getRandomOffset(),
        orbitPhase: (Math.PI * 3) / 2 + getRandomOffset(), // 270 degrees offset
      },
    ];

    // Create logos
    const logoGroups = logoConfigs.map((config, index) => {
      const group = new THREE.Group();

      // Initial position (will be updated in animation loop)
      group.position.set(0, 0.5, 0);

      // Create logo with properly rounded edges and thinner depth
      const boxSize = config.scale;
      const boxDepth = boxSize * 0.08; // Even thinner for a more elegant look

      // Load logo texture
      const texture = createRoundedLogoTexture(config.imageUrl);

      // Create a circular geometry for the logo
      const logoGeometry = new THREE.CylinderGeometry(
        boxSize / 2,
        boxSize / 2,
        boxDepth,
        32
      );
      // Rotate the cylinder to face forward
      logoGeometry.rotateX(Math.PI / 2);
      // 90 degrees offset
      logoGeometry.rotateZ(Math.PI / 2);

      const logoMaterial = new THREE.MeshPhysicalMaterial({
        map: texture,
        transparent: true,
        roughness: 0.1,
        metalness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        lightMapIntensity: 1.0,
        lightMap: texture,
        emissive: 0xffffff,
        emissiveIntensity: 0.4,
        emissiveMap: texture,
      });

      const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
      logoMesh.castShadow = true;
      group.add(logoMesh);

      // Create enhanced glow circle under logo
      const glowGeometry = new THREE.CircleGeometry(config.scale * 0.6, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });

      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.set(0, -1.25, -0.05);
      glowMesh.rotation.x = -Math.PI / 2;
      group.add(glowMesh);

      // Add custom property for animation
      group.userData = {
        rotationSpeed: 0.0005 + index * 0.0002, // Logo's self-rotation speed
        floatSpeed: 0.5 + index * 0.5, // Custom float speed for each logo
        floatAmplitude: 0.03 + index * 0.005, // Custom float height
        orbitRadius: config.orbitRadius,
        orbitPhase: config.orbitPhase,
        orbitSpeed: 0.1, // Speed of orbit rotation
      };

      // Add custom property for glow animation
      glowMesh.userData = {
        pulseSpeed: 0.3 + index * 0.1,
      };

      scene.add(group);
      return group;
    });

    // Animation loop
    const animate = () => {
      const time = Date.now() * 0.001;

      // Animate camera slightly
      camera.position.x = Math.sin(time * 0.1) * 0.5;
      camera.position.y = 1 + Math.sin(time * 0.15) * 0.2;
      camera.lookAt(0, 0, 0);

      // Animate logos with orbital motion
      for (const group of logoGroups) {
        const { orbitRadius, orbitPhase, orbitSpeed } = group.userData;

        // Calculate position on the circular orbit
        const angle = time * orbitSpeed + orbitPhase;
        const x = Math.sin(angle) * orbitRadius;
        const z = Math.cos(angle) * orbitRadius;
        const y =
          0.5 +
          Math.sin(time * group.userData.floatSpeed) *
            group.userData.floatAmplitude;

        // Update position
        group.position.set(x, y, z);

        // Make logo always face the center
        // Position the shadow at a fixed height, separate from the floating animation
        if (group.children[1]) {
          const glowMesh = group.children[1];
          // Keep the glow at a fixed height instead of following the floating animation
          glowMesh.position.y = -y - 0.75; // Fixed position relative to the scene, not the floating logo
        }

        // Self-rotation for the logo
        if (group.children[0]) {
          const logoMesh = group.children[0];
          logoMesh.rotation.y += group.userData.rotationSpeed;

          // Subtle scale pulsing
          const scaleFactor = 1 + Math.sin(time * 0.7) * 0.01;
          logoMesh.scale.set(scaleFactor, 1, scaleFactor);
        }

        // Animate the glow for each logo
        if (group.children[1]) {
          const glowMesh = group.children[1] as THREE.Mesh;
          if (glowMesh.material && 'opacity' in glowMesh.material) {
            (glowMesh.material as THREE.MeshBasicMaterial).opacity =
              0.15 + Math.sin(time * glowMesh.userData.pulseSpeed) * 0.05;
          }
        }
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    // Start animation
    animate();
    setLoaded(true);

    // Handle window resize
    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      if (
        mountRef.current &&
        renderer.domElement.parentNode === mountRef.current
      ) {
        mountRef.current.removeChild(renderer.domElement);
      }

      window.removeEventListener('resize', handleResize);

      // Properly dispose of Three.js resources
      scene.traverse((object) => {
        // Check if it's a mesh with geometry and material
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }

          // Material can be an array or a single material
          if (object.material) {
            if (Array.isArray(object.material)) {
              for (const material of object.material) {
                material.dispose();
              }
            } else {
              object.material.dispose();
            }
          }
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <div className={cn('relative', className)}>
      <div className="absolute bottom-0 left-0 w-[400px] h-[200px] xl:w-[500px] xl:h-[300px] z-10 mx-0 py-0 -my-[210px] xl:translate-y-[100px]">
        <div className="w-full h-full rounded-lg overflow-visible relative">
          <div className="absolute top-2 left-3 text-xs text-muted-foreground/70 font-mono flex items-center gap-2 z-20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Built on:
          </div>
          <div ref={mountRef} className="w-full h-full">
            {!loaded && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white">Loading onchain partners...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorDock;
