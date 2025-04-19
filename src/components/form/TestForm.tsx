
import React from 'react';
import { useFormState } from '@/hooks/form/useFormState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TestFormProps {
  onSubmit: (data: any) => void;
}

const TestForm: React.FC<TestFormProps> = ({ onSubmit }) => {
  const { formState, setFieldValue, validateForm, resetForm } = useFormState('test-form', {
    name: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const data = Object.entries(formState.fields).reduce((acc, [key, field]) => ({
        ...acc,
        [key]: field.value
      }), {});
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          value={formState.fields.name.value}
          onChange={e => setFieldValue('name', e.target.value)}
          placeholder="Name"
        />
        {formState.fields.name.error && (
          <p className="text-red-500 text-sm mt-1">{formState.fields.name.error}</p>
        )}
      </div>
      <div>
        <Input
          value={formState.fields.email.value}
          onChange={e => setFieldValue('email', e.target.value)}
          placeholder="Email"
        />
        {formState.fields.email.error && (
          <p className="text-red-500 text-sm mt-1">{formState.fields.email.error}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit">Submit</Button>
        <Button type="button" variant="outline" onClick={resetForm}>Reset</Button>
      </div>
    </form>
  );
};

export default TestForm;
