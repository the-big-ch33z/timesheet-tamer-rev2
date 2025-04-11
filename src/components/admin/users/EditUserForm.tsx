
import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { User } from "@/types";
import { useEditUserForm } from "./hooks/useEditUserForm";
import { UserFormContent } from "./form-sections/UserFormContent";

interface EditUserFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  onSubmit: (data: any) => Promise<void>;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  isOpen,
  onOpenChange,
  selectedUser,
  onSubmit
}) => {
  const { form, schedules, handleSubmit } = useEditUserForm({ 
    selectedUser, 
    onSubmit, 
    onOpenChange 
  });

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit User</SheetTitle>
          <SheetDescription>
            {selectedUser ? `Update details for ${selectedUser.name}` : "Update user details"}
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-6">
            <UserFormContent 
              form={form}
              schedules={schedules}
            />

            <SheetFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update User</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export { UserEditFormValues } from "./hooks/useEditUserForm";
