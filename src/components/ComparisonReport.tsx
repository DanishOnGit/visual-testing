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
}

const ComparisonReport: React.FC<ComparisonReportProps> = ({
  score,
  analysis,
  differences,
  parameters,
  parameterAnalysis,
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
        size="large"
        weight="semibold"
        color="surface.text.primary.normal"
        marginBottom={"spacing.5"}
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
              <Heading size="large" weight="semibold">
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
      </Box>
      <Box padding="spacing.5" paddingLeft="spacing.0" paddingRight="spacing.0">
        {/* <Box
          marginBottom={"spacing.5"}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box display="flex" gap="spacing.3">
            <Button variant="secondary" size="small">
              <Box display="flex" alignItems="center">
                <RadioGroup>
                  <Radio size="small" value="typography" />
                </RadioGroup>
                <Text marginLeft="spacing.2">Typography</Text>
                <Counter
                  value={
                    differences.filter((d) =>
                      d.toLowerCase().includes("typography")
                    ).length || 0
                  }
                  color="primary"
                  size="small"
                  emphasis="subtle"
                  marginLeft="spacing.2"
                />
              </Box>
            </Button>
            <Button variant="secondary" size="small">
              <Box display="flex" alignItems="center">
                <RadioGroup>
                  <Radio size="small" value="layout" />
                </RadioGroup>
                <Text marginLeft="spacing.2">Layout & alignment</Text>
                <Counter
                  value={
                    differences.filter(
                      (d) =>
                        d.toLowerCase().includes("layout") ||
                        d.toLowerCase().includes("alignment")
                    ).length || 0
                  }
                  color="primary"
                  size="small"
                  emphasis="subtle"
                  marginLeft="spacing.2"
                />
              </Box>
            </Button>
            <Button variant="secondary" size="small">
              <Box display="flex" alignItems="center">
                <RadioGroup>
                  <Radio size="small" value="responsiveness" />
                </RadioGroup>
                <Text marginLeft="spacing.2">Responsiveness</Text>
                <Counter
                  value={
                    differences.filter((d) =>
                      d.toLowerCase().includes("responsive")
                    ).length || 0
                  }
                  color="primary"
                  size="small"
                  emphasis="subtle"
                  marginLeft="spacing.2"
                />
              </Box>
            </Button>
          </Box>
        </Box> */}
        <Box display={"grid"} gridTemplateColumns={"1fr 1fr"} gap={"spacing.3"}>
          <Card>
            <CardBody>
              <Text marginBottom={"spacing.3"} weight="semibold">
                Typography
              </Text>
              <Box>
                <ProgressBar
                  label=""
                  value={
                    parameterAnalysis?.typography?.score ||
                    parameters?.typography
                  }
                  max={100}
                  color={getScoreColor(
                    parameterAnalysis?.typography?.score ||
                      parameters?.typography ||
                      0
                  )}
                  size="medium"
                  variant="meter"
                  marginBottom={"spacing.5"}
                />
                {parameterAnalysis?.typography?.explanation && (
                  <Text
                    size="small"
                    color="surface.text.gray.subtle"
                    marginTop="spacing.3"
                  >
                    {parameterAnalysis.typography.explanation}
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text marginBottom={"spacing.3"} weight="semibold">
                Layout & alignment
              </Text>
              <Box>
                <ProgressBar
                  label=""
                  value={
                    parameterAnalysis?.layoutAlignment?.score ||
                    parameters?.layoutAlignment
                  }
                  max={100}
                  color={getScoreColor(
                    parameterAnalysis?.layoutAlignment?.score ||
                      parameters?.layoutAlignment ||
                      0
                  )}
                  size="medium"
                  variant="meter"
                  marginBottom={"spacing.5"}
                />
                {parameterAnalysis?.layoutAlignment?.explanation && (
                  <Text
                    size="small"
                    color="surface.text.gray.subtle"
                    marginTop="spacing.3"
                  >
                    {parameterAnalysis.layoutAlignment.explanation}
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text marginBottom={"spacing.3"} weight="semibold">
                Visual Styling
              </Text>
              <Box>
                <ProgressBar
                  label=""
                  value={
                    parameterAnalysis?.visualStyling?.score ||
                    parameters?.visualStyling
                  }
                  max={100}
                  color={getScoreColor(
                    parameterAnalysis?.visualStyling?.score ||
                      parameters?.visualStyling ||
                      0
                  )}
                  size="medium"
                  variant="meter"
                  marginBottom={"spacing.5"}
                />
                {parameterAnalysis?.visualStyling?.explanation && (
                  <Text
                    size="small"
                    color="surface.text.gray.subtle"
                    marginTop="spacing.3"
                  >
                    {parameterAnalysis.visualStyling.explanation}
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
          <Card borderRadius="large">
            <CardBody>
              <Text marginBottom={"spacing.3"} weight="semibold">
                Copy
              </Text>
              <Box>
                <ProgressBar
                  label=""
                  value={parameterAnalysis?.copy?.score || parameters?.copy}
                  max={100}
                  color={getScoreColor(
                    parameterAnalysis?.copy?.score || parameters?.copy || 0
                  )}
                  size="medium"
                  variant="meter"
                  marginBottom={"spacing.5"}
                />
                {parameterAnalysis?.copy?.explanation && (
                  <Text
                    size="small"
                    color="surface.text.gray.subtle"
                    marginTop="spacing.3"
                  >
                    {parameterAnalysis.copy.explanation}
                  </Text>
                )}
              </Box>
            </CardBody>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default ComparisonReport;
