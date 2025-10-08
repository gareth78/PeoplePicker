'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  Node,
  Edge,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { fetchJson } from '@/lib/client';
import type { OrgResponse, User, UserLite } from '@/lib/types';
import OrgNode from './OrgNode';
import OrgToolbar from './OrgToolbar';
import ProfileDrawer from './ProfileDrawer';
import { Loader2 } from 'lucide-react';

const LEVEL_SPACING = 220;
const SIBLING_SPACING = 220;

type OrgNodeData = {
  user: UserLite;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  canExpand: boolean;
  isLoading: boolean;
};

type ReportState = Record<string, { nextCursor?: string; loading: boolean; initialized: boolean }>;

type OrgChartViewProps = {
  focusId: string;
};

export default function OrgChartView({ focusId }: OrgChartViewProps) {
  return (
    <ReactFlowProvider>
      <OrgChartInner focusId={focusId} />
    </ReactFlowProvider>
  );
}

function OrgChartInner({ focusId }: OrgChartViewProps) {
  const [nodes, setNodes] = useState<Node<OrgNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [nodeMap, setNodeMap] = useState<Record<string, UserLite>>({});
  const [reports, setReports] = useState<ReportState>({});
  const adjacency = useRef(new Map<string, string[]>());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLite, setSelectedLite] = useState<UserLite | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const reactFlow = useReactFlow();

  const nodeTypes = useMemo(
    () => ({
      orgNode: OrgNode
    }),
    []
  );

  const hasExpandableReports = useCallback(
    (managerId: string) => {
      const state = reports[managerId];
      return Boolean(state?.nextCursor) || !state?.initialized;
    },
    [reports]
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      setSelectedLite(nodeMap[id] ?? null);
    },
    [nodeMap]
  );

  const handleExpand = useCallback(
    async (managerId: string) => {
      const state = reports[managerId];
      if (state?.loading) return;

      setReports((prev) => ({
        ...prev,
        [managerId]: {
          ...prev[managerId],
          loading: true
        }
      }));

      try {
        const params = new URLSearchParams();
        params.set('pageSize', '25');
        if (state?.nextCursor) {
          params.set('cursor', state.nextCursor);
        }
        const data = await fetchJson<OrgResponse>(`/api/org/${managerId}?${params.toString()}`);
        const existing = adjacency.current.get(managerId) ?? [];
        const combined = Array.from(new Set([...existing, ...data.reports.map((r) => r.id)]));
        adjacency.current.set(managerId, combined);

        const mapUpdates: Record<string, UserLite> = {};
        data.reports.forEach((report) => {
          mapUpdates[report.id] = report;
          adjacency.current.set(report.id, adjacency.current.get(report.id) ?? []);
        });

        setNodeMap((prev) => ({
          ...prev,
          ...mapUpdates
        }));

        setReports((prev) => {
          const next: ReportState = {
            ...prev,
            [managerId]: {
              nextCursor: data.nextCursor,
              loading: false,
              initialized: true
            }
          };
          data.reports.forEach((report) => {
            if (!next[report.id]) {
              next[report.id] = { initialized: false, loading: false };
            }
          });
          return next;
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to expand reports', error);
        setReports((prev) => ({
          ...prev,
          [managerId]: {
            ...prev[managerId],
            loading: false
          }
        }));
      }
    },
    [reports]
  );

  const recomputeGraph = useCallback(
    (map: Record<string, UserLite>) => {
      const positions = computeLayout(focusId, adjacency.current, map);
      const newNodes: Node<OrgNodeData>[] = Object.values(map).map((user) => ({
        id: user.id,
        type: 'orgNode',
        position: positions[user.id] ?? { x: 0, y: 0 },
        data: {
          user,
          onSelect: handleSelect,
          onExpand: handleExpand,
          canExpand: hasExpandableReports(user.id),
          isLoading: reports[user.id]?.loading ?? false
        }
      }));

      const newEdges: Edge[] = [];
      adjacency.current.forEach((children, parent) => {
        children.forEach((child) => {
          if (map[child]) {
            newEdges.push({ id: `${parent}-${child}`, source: parent, target: child, animated: false, type: 'smoothstep' });
          }
        });
      });

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [focusId, handleExpand, handleSelect, hasExpandableReports, reports]
  );

  useEffect(() => {
    recomputeGraph(nodeMap);
  }, [nodeMap, recomputeGraph]);

  const initialize = useCallback(async () => {
    setInitialLoading(true);
    adjacency.current.clear();
    setReports({});
    try {
      const data = await fetchJson<OrgResponse>(`/api/org/${focusId}`);
      const map: Record<string, UserLite> = { [data.node.id]: data.node };
      adjacency.current.set(data.node.id, data.reports.map((report) => report.id));
      data.reports.forEach((report) => {
        map[report.id] = report;
        adjacency.current.set(report.id, adjacency.current.get(report.id) ?? []);
      });
      setNodeMap(map);
      setReports((prev) => {
        const next: ReportState = {
          ...prev,
          [data.node.id]: {
            nextCursor: data.nextCursor,
            loading: false,
            initialized: true
          }
        };
        data.reports.forEach((report) => {
          if (!next[report.id]) {
            next[report.id] = { initialized: false, loading: false };
          }
        });
        return next;
      });
      recomputeGraph(map);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load org chart', error);
    } finally {
      setInitialLoading(false);
      setTimeout(() => {
        reactFlow.fitView({ padding: 0.2 });
      }, 150);
    }
  }, [focusId, reactFlow, recomputeGraph]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!selectedId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let canceled = false;
    setProfileLoading(true);
    fetchJson<User>(`/api/users/${selectedId}`)
      .then((data) => {
        if (canceled) return;
        setProfile(data);
      })
      .catch(() => {
        if (canceled) return;
        setProfile(null);
      })
      .finally(() => {
        if (canceled) return;
        setProfileLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [selectedId]);

  const handleCloseDrawer = useCallback(() => {
    setSelectedId(null);
    setSelectedLite(null);
    setProfile(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-100 p-4 lg:flex-row">
      <div className="flex-1 rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Org Chart</h1>
            <p className="text-xs text-slate-500">Click a colleague to view their profile and expand their team.</p>
          </div>
          <OrgToolbar />
        </div>
        <div className="h-[calc(100vh-200px)] rounded-b-2xl">
          {initialLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={32} color="#e2e8f0" />
              <MiniMap pannable zoomable />
              <Controls showInteractive={false} />
            </ReactFlow>
          )}
        </div>
      </div>
      <ProfileDrawer user={selectedLite} profile={profile} loading={profileLoading} onClose={handleCloseDrawer} />
    </div>
  );
}

type PositionMap = Record<string, { x: number; y: number }>;

function computeLayout(rootId: string, adjacency: Map<string, string[]>, map: Record<string, UserLite>): PositionMap {
  const positions: PositionMap = {};
  let xIndex = 0;

  const visited = new Set<string>();

  const dfs = (id: string, depth: number): number => {
    visited.add(id);
    const children = adjacency.get(id) ?? [];
    const validChildren = children.filter((child) => map[child]);

    if (validChildren.length === 0) {
      const currentIndex = xIndex;
      positions[id] = { x: currentIndex * SIBLING_SPACING, y: depth * LEVEL_SPACING };
      xIndex += 1;
      return currentIndex;
    }

    const childPositions = validChildren.map((child) => dfs(child, depth + 1));
    const min = Math.min(...childPositions);
    const max = Math.max(...childPositions);
    const center = (min + max) / 2;
    positions[id] = { x: center * SIBLING_SPACING, y: depth * LEVEL_SPACING };
    return center;
  };

  dfs(rootId, 0);

  Object.keys(map).forEach((id) => {
    if (!visited.has(id)) {
      positions[id] = positions[id] ?? { x: 0, y: LEVEL_SPACING };
    }
  });

  return positions;
}
