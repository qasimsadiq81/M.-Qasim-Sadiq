
export interface BoundingBox {
  box_2d: [number, number, number, number]; 
  label: string;
}

export type AnnotationType = 'RISK' | 'CLEAR' | 'INFO';

export interface ManualAnnotation {
  id: string;
  box_2d: [number, number, number, number];
  label: string;
  type: AnnotationType;
  isAI?: boolean;
  verified?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TelecomIssue {
  issue: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  impact: string;
}

export interface CorrectiveAction {
  action: string;
  priority: 'IMMEDIATE' | 'SHORT TERM' | 'PLANNED';
}

export interface TelecomAuditData {
  scene_type: string;
  identified_assets: string[];
  installation_quality: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
  detected_issues: TelecomIssue[];
  fiber_risk_assessment: {
    bend_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    handling_risk: 'LOW' | 'MEDIUM' | 'HIGH';
    maintenance_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  operational_impact: string[];
  recommended_corrective_actions: CorrectiveAction[];
  audit_readiness: 'FAIL' | 'PARTIAL' | 'PASS';
  confidence_score: number;
  notes: string;
}

export interface AnalysisResponse {
  description: string;
  boxes: BoundingBox[];
  auditData?: TelecomAuditData;
  audioTranscript?: string;
  acousticEnvironment?: string;
  groundingSources?: GroundingSource[];
  simulationUrl?: string;
}

export type MediaType = 'image' | 'video' | 'audio';

export interface FileData {
  file: File;
  previewUrl: string;
  type: MediaType;
  base64?: string;
}
