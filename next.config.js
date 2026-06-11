// 最佳实践配置示例
module.exports = {
  experimental: {
    serverComponentsExternalPackages: ['@opendocsg/pdf2md', '@hyzyla/pdfium', 'pdf2md-js', 'sharp'],
    esmExternals: 'loose'
  }
};
