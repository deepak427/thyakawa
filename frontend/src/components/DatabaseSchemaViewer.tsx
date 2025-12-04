import React, { useState } from 'react';
import { SCHEMA_DATA, SchemaField } from '../data/schemaData';

interface DatabaseSchemaViewerProps {
  tables: string[];
}

interface RelationTooltipProps {
  tableName: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const RelationTooltip: React.FC<RelationTooltipProps> = ({ tableName, position, onClose }) => {
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  const [nestedPosition, setNestedPosition] = useState<{ x: number; y: number } | null>(null);
  
  const table = SCHEMA_DATA[tableName];
  if (!table) return null;

  // Smart positioning to keep tooltip on screen
  const getAdjustedPosition = () => {
    const tooltipWidth = 320; // w-80 = 320px
    const tooltipHeight = 500; // Approximate max height
    const padding = 16;

    let x = position.x;
    let y = position.y;

    // Check right boundary
    if (x + tooltipWidth > window.innerWidth - padding) {
      x = window.innerWidth - tooltipWidth - padding;
    }

    // Check bottom boundary
    if (y + tooltipHeight > window.innerHeight - padding) {
      y = window.innerHeight - tooltipHeight - padding;
    }

    // Check top boundary
    if (y < padding) {
      y = padding;
    }

    // Check left boundary
    if (x < padding) {
      x = padding;
    }

    return { x, y };
  };

  const adjustedPosition = getAdjustedPosition();

  const handleRelationHover = (relationName: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setNestedPosition({
      x: rect.right + 10,
      y: rect.top
    });
    setHoveredRelation(relationName);
  };

  return (
    <>
      <div
        className="fixed z-[60] pointer-events-none"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        <div
          className={`pointer-events-auto bg-white rounded-xl shadow-2xl border-2 ${table.color} w-80 animate-scale-in`}
          onMouseLeave={onClose}
        >
          {/* Tooltip Header */}
          <div className="p-3 border-b-2 border-current bg-gradient-to-r from-white to-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {table.name}
              </h4>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">{table.description}</p>
          </div>

          {/* Tooltip Fields */}
          <div className="p-3 max-h-96 overflow-y-auto">
            <div className="space-y-1.5">
              {table.fields.map((field) => (
                <div
                  key={field.name}
                  className={`flex items-start gap-2 text-xs p-2 rounded-lg transition-all ${
                    field.relation
                      ? 'hover:bg-purple-50 cursor-pointer border border-transparent hover:border-purple-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={(e) => field.relation && handleRelationHover(field.relation, e)}
                  onMouseLeave={() => !field.relation && setHoveredRelation(null)}
                >
                  <span className="font-mono font-semibold text-gray-800 min-w-[100px]">
                    {field.name}
                  </span>
                  <span className="text-gray-600 text-xs">{field.type}</span>
                  <div className="flex gap-1 ml-auto flex-shrink-0">
                    {field.required && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded">
                        req
                      </span>
                    )}
                    {field.unique && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">
                        uniq
                      </span>
                    )}
                    {field.relation && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded flex items-center gap-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {field.relation}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hover hint */}
          {table.fields.some(f => f.relation) && (
            <div className="px-3 py-2 bg-purple-50 border-t border-purple-100">
              <p className="text-[10px] text-purple-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Hover over relations to see nested tables
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nested Tooltip */}
      {hoveredRelation && nestedPosition && (
        <RelationTooltip
          tableName={hoveredRelation}
          position={nestedPosition}
          onClose={() => setHoveredRelation(null)}
        />
      )}
    </>
  );
};

export const DatabaseSchemaViewer: React.FC<DatabaseSchemaViewerProps> = ({ tables }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  if (tables.length === 0) return null;

  const handleRelationHover = (relationName: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const tooltipWidth = 320;
    
    // Position to the right by default, or left if not enough space
    let x = rect.right + 10;
    if (x + tooltipWidth > window.innerWidth - 16) {
      x = rect.left - tooltipWidth - 10;
    }
    
    setTooltipPosition({
      x,
      y: rect.top
    });
    setHoveredRelation(relationName);
  };

  const handleRelationLeave = () => {
    setHoveredRelation(null);
    setTooltipPosition(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group"
        title="View Database Schema"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
          {tables.length}
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    Database Schema
                  </h2>
                  <p className="text-blue-100 mt-1">Hover over relations to explore connections</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tables.map((tableName) => {
                  const table = SCHEMA_DATA[tableName];
                  if (!table) return null;

                  return (
                    <div key={tableName} className={`border-2 rounded-xl overflow-hidden ${table.color} transition-all hover:shadow-lg`}>
                      {/* Table Header */}
                      <div className="p-4 border-b-2 border-current bg-gradient-to-r from-white to-gray-50">
                        <h3 className="text-xl font-bold text-gray-800">{table.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{table.description}</p>
                      </div>

                      {/* Fields */}
                      <div className="p-4">
                        <div className="space-y-2">
                          {table.fields.map((field) => (
                            <div
                              key={field.name}
                              className={`flex items-start gap-2 text-sm p-2 rounded-lg transition-all ${
                                field.relation
                                  ? 'hover:bg-purple-50 cursor-pointer border border-transparent hover:border-purple-200 hover:shadow-sm'
                                  : 'hover:bg-gray-50'
                              }`}
                              onMouseEnter={(e) => field.relation && handleRelationHover(field.relation, e)}
                              onMouseLeave={handleRelationLeave}
                            >
                              <span className="font-mono font-semibold text-gray-800 min-w-[120px]">
                                {field.name}
                              </span>
                              <span className="text-gray-600">{field.type}</span>
                              <div className="flex gap-1 ml-auto flex-shrink-0">
                                {field.required && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                    required
                                  </span>
                                )}
                                {field.unique && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                    unique
                                  </span>
                                )}
                                {field.relation && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded flex items-center gap-1 hover:bg-purple-200 transition-colors">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                    {field.relation}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Relation Tooltip */}
          {hoveredRelation && tooltipPosition && (
            <RelationTooltip
              tableName={hoveredRelation}
              position={tooltipPosition}
              onClose={handleRelationLeave}
            />
          )}
        </div>
      )}
    </>
  );
};
