import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Counter,
  Divider,
  Heading,
  ProgressBar,
  Radio,
  RadioGroup,
  SearchIcon,
  Text,
  TextInput,
} from "@razorpay/blade/components";

interface ComparisonReportProps {
  score: number;
  analysis: string;
  differences: string[];
  parameters?: {
    typography: number;
    layoutAlignment: number;
    visualStyling: number;
    copy: number;
  };
  parameterAnalysis?: {
    typography?: { score: number; explanation: string };
    layoutAlignment?: { score: number; explanation: string };
    visualStyling?: { score: number; explanation: string };
    copy?: { score: number; explanation: string };
  };
  weights?: {
    typography: number;
    layout: number;
    colors: number;
    copy: number;
  };
}

const ComparisonReport: React.FC<ComparisonReportProps> = ({
  score,
  analysis,
  differences,
  parameters,
  parameterAnalysis,
  weights = { typography: 0.35, layout: 0.35, colors: 0.25, copy: 0.05 }
}) => {
  const getScoreColor = (
    score: number
  ): "positive" | "negative" | "information" => {
    if (score >= 80) return "positive";
    if (score >= 60) return "information";
    return "negative";
  };

  return (
    <Box>
      <Heading
        size="medium"
        weight="semibold"
        color="surface.text.primary.normal"
      >
        Test Summary
      </Heading>
      <Box display="flex" gap="spacing.5">
        <Card>
          <CardBody>
            <Box
              padding="spacing.5"
              borderRadius="medium"
              backgroundColor="surface.background.gray.intense"
            >
              <Heading
                size="large"
                weight="semibold"
                color="surface.text.primary.normal"
              >
                {score}%
              </Heading>
              <Heading
                size="small"
                weight="regular"
                color="surface.text.gray.subtle"
              >
                match with approved design
              </Heading>
            </Box>
          </CardBody>
        </Card>

        {parameters && (
          <Card>
            <CardBody>
              <Box
                padding="spacing.5"
                borderRadius="medium"
                backgroundColor="surface.background.gray.intense"
              >
                <Heading
                  size="small"
                  weight="semibold"
                  color="surface.text.primary.normal"
                  marginBottom="spacing.3"
                >
                  Parameter Scores
                </Heading>
                <Box marginBottom="spacing.3">
                  <Text size="small">Layout & Alignment : {parameterAnalysis?.layoutAlignment?.score || parameters?.layoutAlignment}%</Text>
                  <ProgressBar
                    value={parameterAnalysis?.layoutAlignment?.score || parameters?.layoutAlignment}
                    max={100}
                    color={getScoreColor(parameterAnalysis?.layoutAlignment?.score || parameters?.layoutAlignment || 0)}
                    size="small"
                    variant="meter"
                  />
                </Box>
                <Box marginBottom="spacing.3">
                  <Text size="small">Typography: {parameterAnalysis?.typography?.score || parameters?.typography}%</Text>
                  <ProgressBar
                    value={parameterAnalysis?.typography?.score || parameters?.typography}
                    max={100}
                    color={getScoreColor(parameterAnalysis?.typography?.score || parameters?.typography || 0)}
                    size="small"
                    variant="meter"
                  />
                </Box>
                <Box marginBottom="spacing.3">
                  <Text size="small">Visual Styling: {parameterAnalysis?.visualStyling?.score || parameters?.visualStyling}%</Text>
                  <ProgressBar
                    value={parameterAnalysis?.visualStyling?.score || parameters?.visualStyling}
                    max={100}
                    color={getScoreColor(parameterAnalysis?.visualStyling?.score || parameters?.visualStyling || 0)}
                    size="small"
                    variant="meter"
                  />
                </Box>
                <Box marginBottom="spacing.3">
                  <Text size="small">Content/Copy : {parameterAnalysis?.copy?.score || parameters?.copy}%</Text>
                  <ProgressBar
                    value={parameterAnalysis?.copy?.score || parameters?.copy}
                    max={100}
                    color={getScoreColor(parameterAnalysis?.copy?.score || parameters?.copy || 0)}
                    size="small"
                    variant="meter"
                  />
                </Box>
              </Box>
            </CardBody>
          </Card>
        )}
      </Box>
{/* 
      {analysis && (
        <Box padding="spacing.5">
          <Heading
            size="small"
            weight="semibold"
            color="surface.text.primary.normal"
            marginBottom="spacing.3"
          >
            Analysis
          </Heading>
          <Text>{analysis}</Text>
        </Box>
      )} */}

      {differences && differences.length > 0 && (
        <Box padding="spacing.5">
          <Heading
            size="small"
            weight="semibold"
            color="surface.text.primary.normal"
            marginBottom="spacing.3"
          >
            Detected Differences
          </Heading>
          {differences.map((diff, index) => (
            <Box key={index} marginBottom="spacing.2">
              <Text>• {diff}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ComparisonReport;
