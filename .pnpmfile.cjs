function readPackage(pkg) {
  // Permitir que esbuild y protobufjs ejecuten sus scripts de instalación
  if (pkg.name === 'esbuild' || pkg.name === 'protobufjs') {
    pkg.scripts = pkg.scripts || {};
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
}

