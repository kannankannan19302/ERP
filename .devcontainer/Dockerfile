FROM node:18

# Install basic development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    zip \
    unzip \
    vim \
    nano \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Install global npm packages
RUN npm install -g npm@latest knex nodemon jest

# Set timezone
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Set environment variables
ENV NODE_ENV=development
ENV PATH=/workspace/node_modules/.bin:$PATH

# Switch to non-root user
USER node