/**
 * Example Component: User Selection with Search and Create
 *
 * This example demonstrates how to use UserSearchModal and UserCreateModal
 * together to provide a complete user selection experience.
 */

import { useState } from "react";
import { useDisclosure, Button, Card, CardBody } from "@heroui/react";
import { FiSearch, FiUserPlus, FiUser } from "react-icons/fi";

import { UserSearchModal, UserCreateModal } from "@/pages/users/components";
import { UserEntity } from "@/models/users";

export function UserSelectionExample() {
  // Modal controls
  const {
    isOpen: isSearchOpen,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
  } = useDisclosure();

  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  // Selected user state
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);

  // Handle user selection (from search or after creation)
  const handleUserSelect = (user: UserEntity) => {
    setSelectedUser(user);
    // You can update form data here
    // setFormData(prev => ({ ...prev, user_id: user.id }));
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <p className="text-sm font-medium text-foreground">Select User *</p>

          {selectedUser ? (
            // Display selected user with option to change
            <div className="flex items-center justify-between p-3 border rounded-lg bg-default-50">
              <div className="flex items-center gap-3">
                <FiUser className="text-default-400" />
                <div>
                  <p className="font-medium">
                    {selectedUser.full_name || selectedUser.username}
                  </p>
                  <p className="text-sm text-default-500">
                    {selectedUser.email}
                  </p>
                  {selectedUser.specialty && (
                    <p className="text-sm text-default-500">
                      Specialty: {selectedUser.specialty}
                    </p>
                  )}
                  {selectedUser.phone_number && (
                    <p className="text-sm text-default-500">
                      Phone: {selectedUser.phone_number}
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                startContent={<FiSearch />}
                variant="light"
                onPress={onSearchOpen}
              >
                Change
              </Button>
            </div>
          ) : (
            // Display selection options when no user is selected
            <div className="flex gap-2">
              {/* Search existing users button */}
              <Button
                className="flex-1 justify-start h-auto p-4"
                startContent={<FiSearch />}
                variant="bordered"
                onPress={onSearchOpen}
              >
                <div className="text-left">
                  <p>Select Existing User</p>
                  <p className="text-sm text-default-500">
                    Choose from registered users
                  </p>
                </div>
              </Button>

              {/* Register new user button */}
              <Button
                className="h-auto p-4"
                color="primary"
                startContent={<FiUserPlus />}
                variant="bordered"
                onPress={onCreateOpen}
              >
                <div className="text-left">
                  <p>New User</p>
                  <p className="text-xs text-default-500">Register</p>
                </div>
              </Button>
            </div>
          )}

          {/* Help text */}
          <p className="text-sm text-default-500">
            Select an existing user or register a new one
          </p>
        </div>

        {/* Modals */}
        <UserSearchModal
          description="Choose a user from the list below"
          isOpen={isSearchOpen}
          selectedUserId={selectedUser?.id}
          title="Select User"
          userTypeFilter="all" // or "doctor" or "manager"
          onClose={onSearchClose}
          onSelect={handleUserSelect}
        />

        <UserCreateModal
          defaultUserType="doctor" // or "manager"
          isOpen={isCreateOpen}
          onClose={onCreateClose}
          onSuccess={handleUserSelect}
        />
      </CardBody>
    </Card>
  );
}

// Example: Doctor-only selection
export function DoctorSelectionExample() {
  const {
    isOpen: isSearchOpen,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
  } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const [selectedDoctor, setSelectedDoctor] = useState<UserEntity | null>(null);

  return (
    <>
      {selectedDoctor ? (
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{selectedDoctor.full_name}</p>
            <p className="text-sm text-default-500">{selectedDoctor.email}</p>
            {selectedDoctor.specialty && (
              <p className="text-sm">Specialty: {selectedDoctor.specialty}</p>
            )}
          </div>
          <Button size="sm" variant="light" onPress={onSearchOpen}>
            Change
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            className="flex-1"
            startContent={<FiSearch />}
            variant="bordered"
            onPress={onSearchOpen}
          >
            Select Doctor
          </Button>
          <Button
            color="primary"
            startContent={<FiUserPlus />}
            onPress={onCreateOpen}
          >
            New Doctor
          </Button>
        </div>
      )}

      <UserSearchModal
        description="Choose a doctor for this membership"
        isOpen={isSearchOpen}
        selectedUserId={selectedDoctor?.id}
        title="Select Doctor"
        userTypeFilter="doctor" // Only show doctors
        onClose={onSearchClose}
        onSelect={setSelectedDoctor}
      />

      <UserCreateModal
        defaultUserType="doctor" // Default to doctor
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={setSelectedDoctor}
      />
    </>
  );
}

// Example: Manager-only selection
export function ManagerSelectionExample() {
  const {
    isOpen: isSearchOpen,
    onOpen: onSearchOpen,
    onClose: onSearchClose,
  } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();
  const [selectedManager, setSelectedManager] = useState<UserEntity | null>(
    null,
  );

  return (
    <>
      {selectedManager ? (
        <div className="p-3 border rounded-lg">
          <p className="font-medium">{selectedManager.full_name}</p>
          <p className="text-sm text-default-500">{selectedManager.email}</p>
          <Button
            className="mt-2"
            size="sm"
            variant="light"
            onPress={onSearchOpen}
          >
            Change Manager
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button className="flex-1" variant="bordered" onPress={onSearchOpen}>
            Select Manager
          </Button>
          <Button color="primary" onPress={onCreateOpen}>
            New Manager
          </Button>
        </div>
      )}

      <UserSearchModal
        description="Choose a manager for this task"
        isOpen={isSearchOpen}
        selectedUserId={selectedManager?.id}
        title="Select Manager"
        userTypeFilter="manager" // Only show managers
        onClose={onSearchClose}
        onSelect={setSelectedManager}
      />

      <UserCreateModal
        defaultUserType="manager" // Default to manager
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={setSelectedManager}
      />
    </>
  );
}
