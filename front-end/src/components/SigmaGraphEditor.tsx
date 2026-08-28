"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Save, X, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface SigmaGraphEditorProps {
  className?: string;
  initialNodes?: NodeData[];
  initialEdges?: EdgeData[];
  onGraphChange?: (nodes: NodeData[], edges: EdgeData[]) => void;
}

function getClientCoordinates(event: MouseEvent | TouchEvent) {
  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY };
  }

  const touch = event.touches[0] ?? event.changedTouches[0];
  return touch ? { x: touch.clientX, y: touch.clientY } : { x: 0, y: 0 };
}

export default function SigmaGraphEditor({
  className,
  initialNodes = [],
  initialEdges = [],
  onGraphChange,
}: SigmaGraphEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const isAddingEdgeRef = useRef(false);
  const edgeSourceRef = useRef<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string | null;
  } | null>(null);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [edgeSource, setEdgeSource] = useState<string | null>(null);
  const [newNodeDialog, setNewNodeDialog] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeColor, setNewNodeColor] = useState("#3b82f6");

  // 通知图变化
  const notifyGraphChange = useCallback(() => {
    if (!graphRef.current || !onGraphChange) return;

    const graph = graphRef.current;
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];

    graph.forEachNode((nodeId) => {
      const attrs = graph.getNodeAttributes(nodeId);
      nodes.push({
        id: nodeId,
        label: attrs.label || nodeId,
        x: attrs.x || 0,
        y: attrs.y || 0,
        size: attrs.size || 15,
        color: attrs.color || "#3b82f6",
      });
    });

    graph.forEachEdge((edgeId, attrs, source, target) => {
      edges.push({
        id: edgeId,
        source,
        target,
        label: attrs.label || "",
      });
    });

    onGraphChange(nodes, edges);
  }, [onGraphChange]);

  useEffect(() => {
    isAddingEdgeRef.current = isAddingEdge;
    edgeSourceRef.current = edgeSource;
  }, [isAddingEdge, edgeSource]);

  // 初始化图
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建图实例
    const graph = new Graph();
    graphRef.current = graph;

    // 添加初始节点
    if (initialNodes.length === 0) {
      // 默认示例数据
      graph.addNode("node1", {
        label: "AI",
        x: Math.random() * 400,
        y: Math.random() * 400,
        size: 15,
        color: "#3b82f6",
      });
      graph.addNode("node2", {
        label: "Machine Learning",
        x: Math.random() * 400,
        y: Math.random() * 400,
        size: 15,
        color: "#8b5cf6",
      });
      graph.addNode("node3", {
        label: "Deep Learning",
        x: Math.random() * 400,
        y: Math.random() * 400,
        size: 15,
        color: "#10b981",
      });
      graph.addEdge("node1", "node2", { label: "includes" });
      graph.addEdge("node2", "node3", { label: "includes" });
    } else {
      initialNodes.forEach((node) => {
        graph.addNode(node.id, {
          label: node.label,
          x: node.x,
          y: node.y,
          size: node.size || 15,
          color: node.color || "#3b82f6",
        });
      });
      initialEdges.forEach((edge) => {
        graph.addEdge(edge.source, edge.target, {
          label: edge.label || "",
        });
      });
    }

    // 创建 Sigma 实例
    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      renderEdgeLabels: true,
      defaultNodeColor: "#3b82f6",
      defaultEdgeColor: "#64748b",
      labelFont: "Arial",
      labelSize: 14,
      labelWeight: "bold",
      zIndex: true,
    });
    sigmaRef.current = sigma;

    // 节点点击事件
    sigma.on("clickNode", ({ node }) => {
      const source = edgeSourceRef.current;
      if (isAddingEdgeRef.current && source) {
        // 添加边
        if (source !== node && !graph.hasEdge(source, node)) {
          graph.addEdge(source, node, { label: "" });
          setIsAddingEdge(false);
          setEdgeSource(null);
          isAddingEdgeRef.current = false;
          edgeSourceRef.current = null;
          notifyGraphChange();
        }
      } else {
        setSelectedNode(node);
      }
    });

    // 画布点击事件（取消选择）
    sigma.on("clickStage", () => {
      setSelectedNode(null);
      setIsAddingEdge(false);
      setEdgeSource(null);
      isAddingEdgeRef.current = false;
      edgeSourceRef.current = null;
    });

    // 节点双击事件（编辑）
    sigma.on("doubleClickNode", ({ node }) => {
      const nodeData = graph.getNodeAttributes(node);
      setEditLabel(nodeData.label || "");
      setSelectedNode(node);
      setIsEditing(true);
    });

    // 节点拖拽
    let draggedNode: string | null = null;
    let isDragging = false;
    let startPos = { x: 0, y: 0 };

    sigma.on("downNode", (e) => {
      isDragging = true;
      draggedNode = e.node;
      const nodePos = graph.getNodeAttributes(e.node);
      startPos = { x: nodePos.x, y: nodePos.y };
    });

    // 监听全局鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !draggedNode || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const pos = sigma.viewportToGraph({ x, y });
      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        draggedNode = null;
        notifyGraphChange();
      }
    };

    // 添加全局事件监听
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // 右键菜单
    sigma.on("rightClickNode", ({ node, event }) => {
      event.original.preventDefault();
      const coordinates = getClientCoordinates(event.original);
      setContextMenu({
        x: coordinates.x,
        y: coordinates.y,
        nodeId: node,
      });
    });

    sigma.on("rightClickStage", ({ event }) => {
      event.original.preventDefault();
      const coordinates = getClientCoordinates(event.original);
      setContextMenu({
        x: coordinates.x,
        y: coordinates.y,
        nodeId: null,
      });
    });

    // 清理函数
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      sigma.kill();
    };
  }, [notifyGraphChange]);

  // 保存编辑
  const handleSaveEdit = () => {
    if (!selectedNode || !graphRef.current) return;
    graphRef.current.setNodeAttribute(selectedNode, "label", editLabel);
    setIsEditing(false);
    setSelectedNode(null);
    notifyGraphChange();
  };

  // 删除节点
  const handleDeleteNode = () => {
    if (!selectedNode || !graphRef.current) return;
    graphRef.current.dropNode(selectedNode);
    setSelectedNode(null);
    setContextMenu(null);
    notifyGraphChange();
  };

  // 添加新节点
  const handleAddNode = () => {
    if (!newNodeLabel.trim() || !graphRef.current) return;

    const nodeId = `node_${Date.now()}`;
    const centerX = sigmaRef.current?.getCamera().x || 0;
    const centerY = sigmaRef.current?.getCamera().y || 0;

    graphRef.current.addNode(nodeId, {
      label: newNodeLabel,
      x: centerX + (Math.random() - 0.5) * 200,
      y: centerY + (Math.random() - 0.5) * 200,
      size: 15,
      color: newNodeColor,
    });

    setNewNodeDialog(false);
    setNewNodeLabel("");
    setNewNodeColor("#3b82f6");
    notifyGraphChange();
  };

  // 开始添加边
  const handleStartAddEdge = () => {
    if (!selectedNode) return;
    setIsAddingEdge(true);
    setEdgeSource(selectedNode);
    isAddingEdgeRef.current = true;
    edgeSourceRef.current = selectedNode;
    setContextMenu(null);
  };

  // 删除边
  const handleDeleteEdge = (edgeId: string) => {
    if (!graphRef.current) return;
    graphRef.current.dropEdge(edgeId);
    notifyGraphChange();
  };

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const colors = [
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#06b6d4", // cyan
    "#ec4899", // pink
  ];

  return (
    <div className={cn("relative w-full h-full", className)}>
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          size="sm"
          onClick={() => setNewNodeDialog(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加节点
        </Button>
        {selectedNode && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const nodeData = graphRef.current?.getNodeAttributes(selectedNode);
                setEditLabel(nodeData?.label || "");
                setIsEditing(true);
              }}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              编辑
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleStartAddEdge}
              disabled={isAddingEdge}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              添加连接
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteNode}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          </>
        )}
        {isAddingEdge && (
          <div className="px-3 py-1 bg-primary/20 text-primary rounded text-sm flex items-center">
            点击目标节点创建连接
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 h-6 px-2"
              onClick={() => {
                setIsAddingEdge(false);
                setEdgeSource(null);
                isAddingEdgeRef.current = false;
                edgeSourceRef.current = null;
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* 画布容器 */}
      <div ref={containerRef} className="w-full h-full bg-background border rounded-lg" />

      {/* 编辑对话框 */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑节点</DialogTitle>
            <DialogDescription>修改节点的标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">标签</Label>
              <Input
                id="edit-label"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>颜色</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => {
                  const currentColor = selectedNode && graphRef.current?.hasNode(selectedNode)
                    ? graphRef.current.getNodeAttribute(selectedNode, "color")
                    : null;
                  return (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        currentColor === color
                          ? "border-foreground scale-110"
                          : "border-transparent hover:scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        if (selectedNode && graphRef.current && graphRef.current.hasNode(selectedNode)) {
                          graphRef.current.setNodeAttribute(selectedNode, "color", color);
                          notifyGraphChange();
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加节点对话框 */}
      <Dialog open={newNodeDialog} onOpenChange={setNewNodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加新节点</DialogTitle>
            <DialogDescription>创建一个新的知识节点</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-label">标签</Label>
              <Input
                id="new-label"
                value={newNodeLabel}
                onChange={(e) => setNewNodeLabel(e.target.value)}
                placeholder="输入节点名称"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNode();
                }}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>颜色</Label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      newNodeColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewNodeColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewNodeDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddNode} disabled={!newNodeLabel.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-background border rounded-lg shadow-lg p-2 min-w-[150px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {contextMenu.nodeId ? (
            <>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm flex items-center gap-2"
                onClick={() => {
                  const nodeData = graphRef.current?.getNodeAttributes(contextMenu.nodeId!);
                  setEditLabel(nodeData?.label || "");
                  setSelectedNode(contextMenu.nodeId);
                  setIsEditing(true);
                  setContextMenu(null);
                }}
              >
                <Edit2 className="h-4 w-4" />
                编辑节点
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm flex items-center gap-2"
                onClick={() => {
                  setSelectedNode(contextMenu.nodeId);
                  handleStartAddEdge();
                }}
              >
                <LinkIcon className="h-4 w-4" />
                添加连接
              </button>
              <button
                className="w-full text-left px-3 py-2 rounded hover:bg-destructive/10 text-destructive text-sm flex items-center gap-2"
                onClick={() => {
                  setSelectedNode(contextMenu.nodeId);
                  handleDeleteNode();
                }}
              >
                <Trash2 className="h-4 w-4" />
                删除节点
              </button>
            </>
          ) : (
            <button
              className="w-full text-left px-3 py-2 rounded hover:bg-accent text-sm flex items-center gap-2"
              onClick={() => {
                setNewNodeDialog(true);
                setContextMenu(null);
              }}
            >
              <Plus className="h-4 w-4" />
              添加节点
            </button>
          )}
        </div>
      )}

      {/* 选中节点信息 */}
      {selectedNode && !isEditing && graphRef.current?.hasNode(selectedNode) && (
        <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="text-sm font-semibold mb-1">选中节点</div>
          <div className="text-xs text-muted-foreground">
            {graphRef.current.getNodeAttribute(selectedNode, "label") || selectedNode}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            双击编辑 | 拖拽移动 | 右键菜单
          </div>
        </div>
      )}
    </div>
  );
}

