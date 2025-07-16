import { Canvas } from '@react-three/fiber';
import { Center, Float, OrbitControls } from '@react-three/drei';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Letter3D({ 
  position, 
  color = '#000000', 
  scale = 1
}: {
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[0.6, 0.8, 0.2]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </Float>
  );
}

function Arrow3D({ 
  position, 
  rotation, 
  color = '#3b82f6',
  scale = 0.3 
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  scale?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <Float speed={3} rotationIntensity={0.2} floatIntensity={0.1}>
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <coneGeometry args={[0.3, 1, 6]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
    </Float>
  );
}

function Logo3DScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.3} />
      
      <Center>
        <group>
          {/* NEXT line */}
          <group position={[0, 0.5, 0]}>
            <Letter3D position={[-2.5, 0, 0]} color="#3b82f6" />
            <Arrow3D 
              position={[-1.8, 0.3, 0]} 
              rotation={[0, 0, 0]} 
              color="#3b82f6"
              scale={0.2}
            />
            <Letter3D position={[-1.2, 0, 0]} color="#000000" />
            <Letter3D position={[-0.6, 0, 0]} color="#000000" />
            <Letter3D position={[0, 0, 0]} color="#000000" />
            <Arrow3D 
              position={[0.6, 0, 0]} 
              rotation={[0, 0, -Math.PI / 2]} 
              color="#000000"
              scale={0.2}
            />
          </group>
          
          {/* MOVEMENT line */}
          <group position={[0, -0.5, 0]}>
            <Letter3D position={[-2.8, 0, 0]} color="#dc2626" />
            <Letter3D position={[-2.2, 0, 0]} color="#000000" />
            <Letter3D position={[-1.6, 0, 0]} color="#000000" />
            <Letter3D position={[-1.0, 0, 0]} color="#000000" />
            <Letter3D position={[-0.4, 0, 0]} color="#000000" />
            <Letter3D position={[0.2, 0, 0]} color="#000000" />
            <Letter3D position={[0.8, 0, 0]} color="#000000" />
            <Letter3D position={[1.4, 0, 0]} color="#000000" />
            <Arrow3D 
              position={[2.2, 0, 0]} 
              rotation={[0, 0, -Math.PI / 2]} 
              color="#3b82f6"
              scale={0.2}
            />
          </group>
        </group>
      </Center>
      
      <OrbitControls 
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export function Logo3D() {
  return (
    <div className="w-full h-32 md:h-40">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true }}
      >
        <Logo3DScene />
      </Canvas>
    </div>
  );
}