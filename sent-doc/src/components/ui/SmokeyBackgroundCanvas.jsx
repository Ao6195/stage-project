import React, { useEffect, useRef } from 'react';

const vertexSmokeySource = `
attribute vec4 a_position;
void main() {
  gl_Position = a_position;
}
`;

const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;
    vec2 centeredUV = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    float time = iTime * 0.5;
    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x += 0.5 / i * cos(i * 2.0 * distortion.y + time + rippleCenter.x * 3.1415);
        distortion.y += 0.5 / i * cos(i * 2.0 * distortion.x + time + rippleCenter.y * 3.1415);
    }

    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized.split('').map((value) => `${value}${value}`).join('')
    : normalized;

  const parsed = Number.parseInt(safeHex, 16);
  if (Number.isNaN(parsed)) {
    return [1, 1, 1];
  }

  return [
    ((parsed >> 16) & 255) / 255,
    ((parsed >> 8) & 255) / 255,
    (parsed & 255) / 255,
  ];
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export default function SmokeyBackgroundCanvas({
  color = '#ffffff',
  className = '',
  blur = 10,
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;

    if (!wrapper || !canvas) return undefined;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });

    if (!gl) return undefined;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSmokeySource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSmokeySource);

    if (!vertexShader || !fragmentShader) {
      return undefined;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return undefined;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return undefined;
    }

    const positionBuffer = gl.createBuffer();
    if (!positionBuffer) {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return undefined;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    );

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const iResolutionLocation = gl.getUniformLocation(program, 'iResolution');
    const iTimeLocation = gl.getUniformLocation(program, 'iTime');
    const iMouseLocation = gl.getUniformLocation(program, 'iMouse');
    const uColorLocation = gl.getUniformLocation(program, 'u_color');

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.clearColor(0, 0, 0, 0);

    const [r, g, b] = hexToRgb(color);
    gl.uniform3f(uColorLocation, r, g, b);

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      sizeRef.current = {
        width,
        height,
        dpr,
      };
    };

    const render = (timestamp) => {
      resize();

      const { width, height } = sizeRef.current;
      const mouseX = width * 0.5;
      const mouseY = height * 0.5;

      gl.uniform2f(iResolutionLocation, width, height);
      gl.uniform1f(iTimeLocation, timestamp * 0.001);
      gl.uniform2f(iMouseLocation, mouseX, mouseY);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      frameRef.current = window.requestAnimationFrame(render);
    };

    window.addEventListener('resize', resize);

    resize();
    frameRef.current = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [color]);

  return (
    <div ref={wrapperRef} className={`smokey-background-canvas ${className}`}>
      <canvas ref={canvasRef} className="smokey-background-canvas__surface" aria-hidden="true" />
      <div
        className="smokey-background-canvas__blur"
        aria-hidden="true"
        style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` }}
      />
    </div>
  );
}
