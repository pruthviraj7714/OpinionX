    FROM oven/bun:latest

    WORKDIR /usr/src/app
    
    COPY ./turbo.json ./
    COPY ./bun.lock ./
    COPY ./package.json ./
    
    COPY ./packages ./packages
    COPY ./apps/backend ./apps/backend

    RUN bun install

    RUN bun --filter=db exec prisma generate
    
    EXPOSE 3000
    
    WORKDIR /usr/src/app/apps/backend
    
    RUN bun --filter=backend run build
    
    CMD ["bun", "run", "start"]