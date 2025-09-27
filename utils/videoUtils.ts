export const extractFrames = (
  videoFile: File,
  intervalInSeconds: number
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    // FIX: Use window.document to explicitly reference browser APIs.
    // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
    const video = (window as any).document.createElement('video');
    const canvas = (window as any).document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];

    if (!ctx) {
      return reject(new Error('Não foi possível obter o contexto do canvas.'));
    }

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const revokeURL = () => {
      const url = video.src;
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };

    video.onloadedmetadata = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        revokeURL();
        return reject(new Error('As dimensões do vídeo não puderam ser determinadas.'));
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;

      const timePoints: number[] = [];
      for (let time = intervalInSeconds; time < duration; time += intervalInSeconds) {
        timePoints.push(time);
      }
      
      // Garante que vídeos curtos tenham pelo menos um frame
      if (timePoints.length === 0 && duration > 0) {
        timePoints.push(duration / 2);
      }
      
      if (timePoints.length === 0) {
          revokeURL();
          return resolve([]);
      }

      let captureIndex = 0;

      const captureFrame = () => {
        requestAnimationFrame(() => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          captureIndex++;

          if (captureIndex < timePoints.length) {
            video.currentTime = timePoints[captureIndex];
          } else {
            revokeURL();
            resolve(frames);
          }
        });
      };

      video.onseeked = () => {
        captureFrame();
      };
      
      // Inicia o processo definindo o tempo do vídeo para o primeiro ponto, o que acionará 'onseeked'
      video.currentTime = timePoints[captureIndex];
    };

    video.onerror = () => {
      revokeURL();
      reject(new Error('Erro ao carregar o arquivo de vídeo. Verifique se o formato é suportado.'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};