# Systematic Review Schema Summary

Based on the comprehensive JSON schema for medical literature data extraction, here are the main sections and key fields:

## Main Sections

### I. Study Metadata and Identification
- Study ID (DOI or PMID)
- First Author
- Year of Publication
- Country

### II. Risk of Bias Assessment
- Tool Used
- Overall Risk
- Domain-Specific Risks:
  - Confounding
  - Selection of Participants
  - Measurement of Outcomes
  - Missing Data
  - Classification of Interventions
  - Deviations from Intended Interventions
  - Selection of Reported Result

### III. Study Design and Purpose
- Research Question
- Study Design
- Control Group Definition

### IV. Patient Characteristics (Baseline)
- Sample Size:
  - Total Patients
  - Preventive SDC Group Size
  - Control Group Size
- Inclusion/Exclusion Criteria
- Age Information (per group)
- Gender Distribution (per group)
- Initial Neurological Status

### V. Clinical and Radiological Factors (Baseline)
- Hydrocephalus
- Brainstem Compression/4th Ventricle Effacement
- (More fields...)

## Key Data Structures

### SourcedString
- value: string
- source_text: exact sentence/phrase from document
- source_location: location in document (e.g., Table 1, Page 4)

### SourcedNumber/SourcedInteger
- value: number/integer
- source_text: exact sentence/phrase
- source_location: location in document

### statisticalReporting
- reportingMethod: mean_sd | median_iqr | median_range | mean_range | other
- mean, standardDeviation, median, iqr (q1, q3), range (min, max)

### countPercentage
- count: SourcedInteger
- percentage: SourcedNumber

### statisticalComparison
- pValue
- effectMeasureType: OR | RR | HR | Beta Coefficient | Other
- effectMeasureValue
- confidenceInterval (lower, upper, confidenceLevel)

## Form Fields for Lector Review

For the application, we'll create simplified per-page templates based on common extraction needs:

### Page 1: Study Identification
- Study ID
- First Author
- Year
- Country

### Page 2: Study Design
- Research Question
- Study Design
- Control Group Definition

### Page 3: Sample Size
- Total Patients
- Intervention Group Size
- Control Group Size

### Page 4: Patient Characteristics
- Age (Mean/SD or Median/IQR)
- Gender (% Male)
- Baseline Neurological Status

### Page 5: Outcomes
- Primary Outcome
- Effect Measure (OR/RR/HR)
- Confidence Interval
- P-value

These templates will be pre-configured in the application for systematic review use.
