# Portal Types (`src/portal/types`)

## Overview
Shared TypeScript interfaces, union types, and domain constants for the PaintKing Portal and HR Attendance modules.

## Interface
- `hrAttendanceTypes.ts:Employee`, `DailyAttendanceSummary`, `EmployeeMonthlyPayrollSummary`, `AttendanceStatus`, `LocationStamp`, `PunchEvidenceMetadata`, `AttendanceRecord`, `BiometricAuditLog`, `GeofenceTarget`, `TerminalConfig`, `EnrollmentQualityDetails`, `UnknownAttemptLog`, `RecognitionStageLatency`, `PlantShiftDefinition`, `PlantHoliday`
- `portalTypes.ts:UserRole`, `PlantLocation`, `ShiftType`, `StockCategory`, `StockMaterialType`, `MATERIAL_TYPE_OPTIONS`, `StockBatchStatus`, `BatchIssueLine`, `StockBatch`, `FifoOverrideReasonCode`, `FifoOverrideLog`, `BalanceReturnCondition`, `BalanceReturnStatus`, `BalanceReturnLine`, `BalanceReturnSlip`, `PlantShiftConfig`, `RequisitionLineItem`, `JobCardType`, `DefectCategory`, `PlantDayEndClosure`, `DocumentStatus`, `UserProfile`, `PortalUserAccount`, `MaterialCategoryOption`, `JobPipelineStage`, `PreSprayIQCRecord`, `FinalQAGateRecord`, `PieceTrackingDetails`, `UniversalJobRecord`, `OrderColorSplit`, `GRNLineItem`, `GoodsReceiptNote`, `RequisitionStatus`, `MaterialRequisitionNote`, `IssuedMaterialItem`, `JobCardMaterialAllocation`, `ProcessStageCount`, `PainterJobStatus`, `PaintingBooth`, `PainterProfile`, `JobCardNature`, `SamplingRecipeSheet`, `SamplingPartyApproval`, `CoatingProcessStage`, `JobCardActionType`, `JobCardProductionProgressLog`, `DailyMaterialConsumptionSnapshot`, `JobCardDailyTargetRecord`, `AssignmentShiftType`, `AssignmentProcessStage`, `AssignmentStatus`, `AssignmentMaterialLog`, `PainterAssignment`, `MasterJobCard`, `JobCard`, `FPAVisualCheckRow`, `FPADeltaValueRow`, `PreProductionInspectionRecord`, `FPAMasterLab`, `FPARecord`, `PaintMixingRecord`, `IQCAspectItem`, `IQCVerifiedItem`, `IQCInspectionRecord`, `IPQCTimeSlotKey`, `IPQCSlotObservation`, `IPQCRecord`, `PackingSlipRecord`, `OQCSampleObservationItem`, `FinalQualityRelease`, `BillableLineItem`, `BillingInvoice`, `GatePassRecord`, `InwardMaterialLineItem`, `MaterialInwardRecord`, `MaterialOutwardRecord`, `DefectItem`, `AuditQuestionItem`, `MNC_AUDIT_SECTIONS`, `Capa8DRecord`, `FourMChangeRecord`, `ProductionOfferingLineItem`, `ProductionOfferingReport`, `HRLeaveRecord`, `CalibrationRecord`, `ProductionPriorityLevel`, `PlantHeadPriorityAssignment`

## Invariants
- None

## Side Effects
- None

## Verification
- Run: `npm run lint && npm run build`
