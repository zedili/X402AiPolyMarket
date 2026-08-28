"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, RotateCcw } from "lucide-react";

const SigmaGraphEditor = dynamic(
  () => import("@/components/SigmaGraphEditor"),
  { ssr: false },
);

export default function KnowledgeGraphPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  const handleGraphChange = (newNodes: any[], newEdges: any[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleExport = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knowledge-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.nodes && data.edges) {
              // 重新加载组件需要重新挂载，这里只是示例
              alert("导入功能需要重新加载组件，请刷新页面后使用导入功能");
            }
          } catch (error) {
            alert("文件格式错误");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-display font-bold">知识图谱编辑器</h1>
        <p className="text-muted-foreground">
          使用 Sigma.js + Graphology 构建的可交互知识图谱编辑器
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 主编辑区 */}
        <div className="lg:col-span-3">
          <Card className="h-[800px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>图谱编辑</CardTitle>
                  <CardDescription>
                    点击节点选择，双击编辑，拖拽移动，右键菜单
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    导出
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    导入
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-80px)]">
              <SigmaGraphEditor
                className="w-full h-full"
                onGraphChange={handleGraphChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="font-semibold mb-1">添加节点</div>
                <div className="text-muted-foreground">
                  点击工具栏"添加节点"按钮，或右键空白处
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">编辑节点</div>
                <div className="text-muted-foreground">
                  双击节点或点击"编辑"按钮
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">移动节点</div>
                <div className="text-muted-foreground">
                  直接拖拽节点到新位置
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">添加连接</div>
                <div className="text-muted-foreground">
                  选中节点后点击"添加连接"，再点击目标节点
                </div>
              </div>
              <div>
                <div className="font-semibold mb-1">删除节点</div>
                <div className="text-muted-foreground">
                  选中节点后点击"删除"按钮，或右键菜单
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>图谱统计</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">节点数量</span>
                <span className="font-semibold">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">连接数量</span>
                <span className="font-semibold">{edges.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>技术栈</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Sigma.js - 高性能图可视化</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Graphology - 图数据结构</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>React - UI 框架</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


