// Polyfill for Promise.withResolvers (Node.js 21+ / older browsers)
// Needed on Node 20 / Safari < 17.4
if (!Promise.withResolvers) {
  Promise.withResolvers = function <T>(): {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
  } {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;

    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    return { promise, resolve: resolve!, reject: reject! };
  };
}

// Suppress known harmless Three.js / WebGL shader compilation warnings
// on Windows ANGLE / WebGL2 when shaders contain double underscores (__).
if (typeof window !== 'undefined') {
  const origError = console.error;
  console.error = function (...args: any[]) {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('THREE.WebGLProgram: Shader Error') ||
      msg.includes('Vertex shader is not compiled') ||
      msg.includes('consecutive underscores (__) are reserved')
    ) {
      return;
    }
    origError.apply(console, args);
  };
}

export {};
