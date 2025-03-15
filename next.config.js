// 最佳实践配置示例
module.exports = {
    experimental: {
      serverComponentsExternalPackages: ['@opendocsg/pdf2md'],
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.externals.push({
          'unpdf': 'window.unpdf',
          'pdfjs-dist': 'window.pdfjsLib'
        })
      }
      return config
    }
  }