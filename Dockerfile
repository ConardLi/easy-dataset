FROM docker.1ms.run/library/node:18-alpine

ARG USE_CHINA_MIRRORS
ENV USE_CHINA_MIRRORS=$USE_CHINA_MIRRORS

# 设置工作目录
WORKDIR /app

# Alpine 依赖（对等替换）
ENV PACKAGES="\
    build-base \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    python3 \
    "

# 使用中国镜像 + 安装依赖
RUN if [ "$USE_CHINA_MIRRORS" = "true" ]; then \
    sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories; \
    fi \
    && apk update \
    && apk add --no-cache $PACKAGES

# 复制package文件
COPY package.json package-lock.json* ./

# 使用中国源（可选）
RUN if [ "$USE_CHINA_MIRRORS" = "true" ]; then \
    yarn config set registry https://registry.npmmirror.com; \
    fi

RUN yarn install

# 复制所有代码
COPY . .

# 构建应用
RUN yarn build

# 暴露端口
EXPOSE 1717

# 启动
CMD ["yarn", "start"]
