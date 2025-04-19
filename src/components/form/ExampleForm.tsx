
import React from 'react';
import { useFormState } from '@/hooks/form/useFormState';
import ControlledInput from './ControlledInput';
import { Button } from '@/components/ui/button';

const ExampleForm = () => {
  const { formState, setFieldValue, validateForm, resetForm } = useFormState(
    {
      name: '',
      email: ''
    },
    {
      name: { required: true },
      email: { 
        required: true,
        rules: [
          {
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please enter a valid email'
          }
        ]
      }
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form is valid, submitting:', formState.fields);
      // Handle form submission
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ControlledInput
        id="name"
        label="Name"
        value={formState.fields.name.value}
        onChange={(value) => setFieldValue('name', value)}
        required={formState.fields.name.required}
        error={formState.fields.name.error}
      />
      
      <ControlledInput
        id="email"
        label="Email"
        value={formState.fields.email.value}
        onChange={(value) => setFieldValue('email', value)}
        required={formState.fields.email.required}
        error={formState.fields.email.error}
        type="email"
      />

      <div className="flex gap-2">
        <Button type="submit" disabled={!formState.isValid}>
          Submit
        </Button>
        <Button type="button" variant="outline" onClick={resetForm}>
          Reset
        </Button>
      </div>
    </form>
  );
};

export default ExampleForm;
