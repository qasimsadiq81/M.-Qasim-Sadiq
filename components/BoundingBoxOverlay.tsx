
import React, { useMemo } from 'react';
import { BoundingBox, ManualAnnotation, AnnotationType } from '../types';
import { Check, ShieldCheck, AlertTriangle } from 'lucide-react';

interface BoundingBoxOverlayProps {
  boxes: BoundingBox[];
  manualBoxes?: ManualAnnotation[];
  containerRef: React.RefObject<HTMLDivElement>;
  onVerifyAI?: (box: BoundingBox) => void;
}

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({ boxes, manualBoxes = [], containerRef, onVerifyAI }) => {
  const allBoxes = useMemo(() => {
    const ai = boxes.map(b => ({ ...b, isAI: true, id: `ai-${Math.random()}`, type: 'INFO' as AnnotationType }));
    const manual = manualBoxes.map(b => ({ ...b, isAI: false }));
    return [...ai, ...manual];
  }, [boxes, manualBoxes]);

  if (allBoxes.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-hidden">
      {allBoxes.map((data: any, index) => {
        const [ymin, xmin, ymax, xmax] = data.box_2d;
        const top = ymin / 10;
        const left = xmin / 10;
        const width = (xmax - xmin) / 10;
        const height = (ymax - ymin) / 10;

        const isRisk = data.type === 'RISK';
        const isClear = data.type === 'CLEAR';
        const isAI = data.isAI;

        const getBorderColor = () => {
          if (isAI) return '#22d3ee'; // Cyan-400
          if (isRisk) return '#e879f9'; // Fuchsia-400
          if (isClear) return '#34d399'; // Emerald-400
          return '#94a3b8'; // Slate-400
        };

        const getLabelBg = () => {
          if (isAI) return 'bg-cyan-400';
          if (isRisk) return 'bg-fuchsia-500';
          if (isClear) return 'bg-emerald-500';
          return 'bg-slate-400';
        };

        const labelText = isAI 
          ? (data.label.includes(':') ? data.label.split(':')[1].trim() : data.label).toLowerCase()
          : data.label.toLowerCase();

        return (
          <React.Fragment key={data.id || index}>
            {/* The Bounding Box Line */}
            <div
              className={`absolute border transition-all duration-300`}
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${Math.max(width, 0.1)}%`,
                height: `${Math.max(height, 0.1)}%`,
                borderColor: getBorderColor(),
                borderWidth: '0.5px', // Very thin line as per screenshot
                backgroundColor: isAI ? 'rgba(34, 211, 238, 0.02)' : 'transparent'
              }}
            >
              {isAI && onVerifyAI && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onVerifyAI(data); }}
                  className="absolute -top-6 -right-2 p-1 bg-slate-900 border border-cyan-500/30 rounded-full text-cyan-400 pointer-events-auto hover:bg-cyan-500 hover:text-slate-950 transition-all shadow-lg"
                >
                  <Check className="w-2 h-2" />
                </button>
              )}
            </div>

            {/* The Label Badge (Screenshot Style) */}
            <div 
              className="absolute z-30 transition-all duration-300"
              style={{ 
                top: `${top}%`,
                left: `${left}%`,
                transform: 'translateY(-100%)',
                minWidth: 'max-content',
              }}
            >
              <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 tracking-tight shadow-md ${getLabelBg()} text-slate-950`}>
                {isRisk && <AlertTriangle className="w-2.5 h-2.5" />}
                {isClear && <ShieldCheck className="w-2.5 h-2.5" />}
                {labelText}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default BoundingBoxOverlay;
