'use client';

import { Box } from '@mui/material';
import { TreeView, TreeItem } from '@mui/lab';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

/**
 * 领域知识树组件
 * @param {Object} props
 * @param {Array} props.nodes - 树节点数组
 */
export default function DomainTreeView({ nodes = [] }) {
  if (!nodes || nodes.length === 0) return null;

  const renderTreeItems = nodes => {
    return nodes.map((node, index) => (
      <TreeItem key={`node-${index}`} nodeId={`node-${index}`} label={node.text} sx={{ mb: 1 }}>
        {node.children && node.children.length > 0 && renderTreeItems(node.children)}
      </TreeItem>
    ));
  };

  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{ flexGrow: 1, overflowY: 'auto' }}
    >
      {renderTreeItems(nodes)}
    </TreeView>
  );
}
