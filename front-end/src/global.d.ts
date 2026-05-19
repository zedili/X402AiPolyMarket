// src/global.d.ts

// 声明所有 .css 文件模块
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// 声明所有 .scss/.sass 文件模块 (如果有用到)
declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

// 声明所有图片资源模块 (防止图片导入也报错)
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';