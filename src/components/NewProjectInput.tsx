import React, { ChangeEvent, useState, useRef } from "react";
import {
  Box,
  Text,
  Button,
  ModalHeader,
  Modal,
  TextInput,
  ModalBody,
  FileUpload,
  ModalFooter,
  CloseIcon,
  IconButton,
} from "@razorpay/blade/components";

interface NewProjectInputProps {
    imageUrl:string;
    setImageUrl: (url: string) => void;
    handleFileChange: (e:{name?:string,fileList?:FileList[]}) => void;
    projectName:string;
    setProjectName: (name: string) => void;
    runTest: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isRunningTest: boolean;
}

const NewProjectInput: React.FC<NewProjectInputProps> = ({ isOpen, setIsOpen, imageUrl,setImageUrl,handleFileChange,projectName,setProjectName,runTest,isRunningTest   }) => {

  return (
    <Box>
      <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} size="medium">
        <ModalHeader
          title="Start a New Project"
        />
        <ModalBody>
          <Box marginBottom="spacing.5">
            <Text size="medium" weight="regular">
              Project Name
            </Text>
            <TextInput
              placeholder="Placeholder"
              size="medium"
              label="Project Name"
              value={projectName}
              onChange={(data) => setProjectName(data.value || "")}
            />
          </Box>
          <Box marginBottom="spacing.5">
            <Text size="medium" weight="regular">
              Add app link
            </Text>
            <TextInput
              placeholder="https://www.razorpay.com"
              size="medium"
              label="Link"
              value={imageUrl}
              onChange={(data) => setImageUrl(data.value || "")}
            />
          </Box>
          <Box marginBottom="spacing.5">
            <Text size="medium" weight="regular">
              Upload Design
            </Text>
            <FileUpload
              label="Drag files here or"
              helpText="You can upload upto 5 files. Max size 5MB."
              uploadType="single"
              maxCount={1}
              maxSize={1 * 1024 * 1024}
              necessityIndicator="optional"
              accept="image/*"
              name="design-file"
              onChange={(e) => handleFileChange(e)}
            />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button isLoading={isRunningTest} onClick={runTest} variant="primary" size="large" isFullWidth isDisabled={isRunningTest}>
            {isRunningTest ? 'Running Test...' : 'Run Test'}
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  );
};

export default NewProjectInput;
