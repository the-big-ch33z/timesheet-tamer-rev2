
import { useState } from "react";
import { User } from "@/types";

export const useUserFilter = (users: User[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  // Handle search term changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  // Filter users based on search term and active/archived status
  const filteredActiveUsers = users.filter(user => 
    (user.status !== 'archived') &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const filteredArchivedUsers = users.filter(user => 
    user.status === 'archived' &&
    (user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return {
    searchTerm,
    activeTab,
    setActiveTab,
    handleSearchChange,
    filteredActiveUsers,
    filteredArchivedUsers
  };
};
