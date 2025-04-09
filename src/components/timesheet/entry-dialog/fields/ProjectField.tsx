
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectFieldProps {
  project: string;
  setProject: (project: string) => void;
}

const ProjectField: React.FC<ProjectFieldProps> = ({ project, setProject }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="project">Project</Label>
      <Select
        value={project}
        onValueChange={setProject}
        required
      >
        <SelectTrigger id="project">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Website Redesign">Website Redesign</SelectItem>
          <SelectItem value="Mobile App Development">Mobile App Development</SelectItem>
          <SelectItem value="Client Meeting">Client Meeting</SelectItem>
          <SelectItem value="Documentation">Documentation</SelectItem>
          <SelectItem value="Research">Research</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectField;
