// 最佳实践配置示例
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@opendocsg/pdf2md', 'pdfjs-dist', '@napi-rs/canvas']
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals.push({
        unpdf: 'window.unpdf',
        'pdfjs-dist': 'window.pdfjsLib',
        '@napi-rs/canvas': 'null'
      });
    } else {
      config.externals.push('canvas', '@napi-rs/canvas');
    }
    return config;
  }
};
