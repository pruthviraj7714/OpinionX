FROM oven/bun:latest

WORKDIR /usr/src/app

COPY ./turbo.json ./
COPY ./bun.lock ./
COPY ./package.json ./

COPY ./packages ./packages
COPY ./apps/worker ./apps/worker

RUN bun install

RUN bun --filter=db exec prisma generate

WORKDIR /usr/src/app/apps/worker

RUN bun --filter=worker run build

CMD ["bun", "run", "start"]