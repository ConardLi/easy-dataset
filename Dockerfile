# 使用Node.js 20作为基础镜像
FROM node:20

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm@9

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制package.json和package-lock.json
COPY package.json package-lock.json* ./

# 安装依赖
#使用国内源加速
#RUN pnpm config set registry https://registry.npmmirror.com && pnpm install
#正常安装
RUN pnpm install

# 复制所有文件
COPY . .

# 构建应用
RUN pnpm build

# 暴露端口
EXPOSE 1717

# 启动应用
CMD ["pnpm", "start"]