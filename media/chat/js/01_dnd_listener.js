// Prevent VS Code's default drag and drop behavior
(function() {
  // This script will be injected into the webview and will run in the webview context
  // We need to capture drag events on the window to prevent VS Code's default behavior
  
  const vscode = acquireVsCodeApi();
  
  for (const evt of ['dragenter','dragover','dragleave','drop','paste']) {
    window.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragover' && e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'; // remove "Press Shift" hint
      }
      if (e.type === 'drop') {
        const dt = e.dataTransfer;
        // 1) Explorer → webview: URIs via text/uri-list
        if (dt?.types?.includes('text/uri-list')) {
          const uris = dt.getData('text/uri-list')
            .split('\n').map(s => s.trim()).filter(Boolean);
          vscode.postMessage({ type: 'files/resolveDrop', payload: { items: uris, reqId: 'drop-1' } });
          return;
        }
        // 2) OS → webview: File objects
        if (dt?.files?.length) {
          const files = [...dt.files].map(f => ({ name: f.name, size: f.size, type: f.type }));
          vscode.postMessage({ type: 'user.drop.osFiles', payload: { files } });
        }
      }
    }, { capture: true }); // capture is crucial
  }
})();