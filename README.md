# ThreeCraft

This is a Minecraft clone built using Three.js and TypeScript. It is a 3D sandbox game where players can explore, build, and destroy their own world made up of blocks.

## Features

- Procedurally generated terrain
- Basic Player movement and collision detection
- Terrain Editing
- Inventory system
- Trees and foliage generation
- Caves and Ores generation
- Game Saving system

## Installation

Use the package manager npm to install on your local machine.

```bash
npm install
```

## Core Technologies

- Three.js: a lightweight 3D graphics library for creating WebGL applications.
- TypeScript: a typed superset of JavaScript that compiles to plain JavaScript.
- Vite: a web application bundler and development server.

## Known Issues

- Opening and closing the inventory too quickly can cause the camera to behave weirdly.
- Collision detection is not always accurate. Sometimes weird collision responses can occur when the player is moving around.
- Since the framerate is capped at 75, the game feels a bit choppy on higher framerate devices. (This is due the fact the draw calls are not interpolated between frames.)

## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
