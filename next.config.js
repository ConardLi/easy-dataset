// 最佳实践配置示例
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@opendocsg/pdf2md', '@napi-rs/canvas', 'pdfjs-dist', '@tiny-tool/pdf2md'],
    esmExternals: 'loose'
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push({
        unpdf: 'window.unpdf',
        'pdfjs-dist': 'window.pdfjsLib'
      });
    } else {
      config.externals.push('@napi-rs/canvas');
      config.externals.push('pdfjs-dist');
      config.externals.push('@tiny-tool/pdf2md');
    }
    return config;
  }
};
