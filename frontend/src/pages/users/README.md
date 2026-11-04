# User Modal Components

Reusable modal components for user management: searching/selecting existing users and creating new users.

## Components

1. **UserSearchModal** - Search and select existing users
2. **UserCreateModal** - Register new users

---

## UserSearchModal

A reusable modal component for searching and selecting users with filtering capabilities.

## Features

- **Search Functionality**: Search users by name, email, or username
- **User Type Filter**: Filter by user type (doctor, manager, or all)
- **Pagination**: Navigate through large user lists
- **Active/Inactive Status**: Visual indication of user status
- **Selection State**: Shows selected user with checkmark
- **Responsive Design**: Works on desktop and mobile devices

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Callback when modal is closed |
| `onSelect` | `(user: UserEntity) => void` | Yes | - | Callback when a user is selected |
| `selectedUserId` | `number` | No | - | ID of currently selected user |
| `userTypeFilter` | `'doctor' \| 'manager' \| 'all'` | No | `'all'` | Default filter for user type |
| `title` | `string` | No | - | Custom modal title |
| `description` | `string` | No | - | Custom modal description |

## Usage

### Basic Usage

```tsx
import { useState } from 'react';
import { useDisclosure } from '@heroui/react';
import { UserSearchModal } from '@/pages/users/components';
import { UserEntity } from '@/models/users';

function MyComponent() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);

  const handleUserSelect = (user: UserEntity) => {
    setSelectedUser(user);
    console.log('Selected user:', user);
  };

  return (
    <>
      <Button onPress={onOpen}>Select User</Button>
      
      <UserSearchModal
        isOpen={isOpen}
        onClose={onClose}
        onSelect={handleUserSelect}
        selectedUserId={selectedUser?.id}
      />
    </>
  );
}
```

### Filter by User Type

```tsx
// Only show doctors
<UserSearchModal
  isOpen={isOpen}
  onClose={onClose}
  onSelect={handleUserSelect}
  userTypeFilter="doctor"
/>

// Only show managers
<UserSearchModal
  isOpen={isOpen}
  onClose={onClose}
  onSelect={handleUserSelect}
  userTypeFilter="manager"
/>

// Show all users (default)
<UserSearchModal
  isOpen={isOpen}
  onClose={onClose}
  onSelect={handleUserSelect}
  userTypeFilter="all"
/>
```

### Custom Title and Description

```tsx
<UserSearchModal
  isOpen={isOpen}
  onClose={onClose}
  onSelect={handleUserSelect}
  title="Select Doctor"
  description="Choose a doctor for this membership"
  userTypeFilter="doctor"
/>
```

### Complete Example (Form Integration)

```tsx
import { useState } from 'react';
import { useDisclosure, Button } from '@heroui/react';
import { UserSearchModal } from '@/pages/users/components';
import { UserEntity } from '@/models/users';
import { FiUser } from 'react-icons/fi';

function MembershipForm() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedDoctor, setSelectedDoctor] = useState<UserEntity | null>(null);

  const handleDoctorSelect = (doctor: UserEntity) => {
    setSelectedDoctor(doctor);
    // Update form data
    console.log('Doctor selected:', doctor);
  };

  return (
    <div>
      {selectedDoctor ? (
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{selectedDoctor.full_name}</p>
            <p className="text-sm text-default-500">{selectedDoctor.email}</p>
            {selectedDoctor.specialty && (
              <p className="text-sm">Specialty: {selectedDoctor.specialty}</p>
            )}
          </div>
          <Button size="sm" variant="light" onPress={onOpen}>
            Change
          </Button>
        </div>
      ) : (
        <Button
          variant="bordered"
          startContent={<FiUser />}
          onPress={onOpen}
          className="w-full"
        >
          Select Doctor
        </Button>
      )}

      <UserSearchModal
        isOpen={isOpen}
        onClose={onClose}
        onSelect={handleDoctorSelect}
        selectedUserId={selectedDoctor?.id}
        userTypeFilter="doctor"
        title="Select Doctor"
        description="Choose a doctor for this membership"
      />
    </div>
  );
}
```

## API Requirements

The component uses the `usersApi` client which expects the backend to support:

- `GET /api/users/` with query parameters:
  - `page`: Page number (default: 1)
  - `page_size`: Items per page (default: 10)
  - `search`: Search term for name, email, username
  - `user_type`: Filter by user type ('doctor' or 'manager')

Response format:
```typescript
{
  count: number;
  next: string | null;
  previous: string | null;
  results: UserEntity[];
}
```

## Styling

The modal uses HeroUI components and follows the application's design system:
- Size: `5xl` for large displays
- Scroll behavior: `inside` (content scrolls within modal)
- Color scheme: Matches application theme
- User type chips: `primary` for doctors, `secondary` for managers
- Status chips: `success` for active, `default` for inactive

## Translation Keys

The component uses i18next for translations. Required keys:

```json
{
  "users": {
    "selectUser": "Select User",
    "selectUserDesc": "Choose a user from the list below",
    "search": "Search by name, email, or username...",
    "userType": "User Type",
    "allTypes": "All Types",
    "doctor": "Doctor",
    "manager": "Manager",
    "name": "Name",
    "email": "Email",
    "specialty": "Specialty",
    "noData": "No users found"
  },
  "common": {
    "loading": "Loading...",
    "search": "Search",
    "status": "Status",
    "active": "Active",
    "inactive": "Inactive",
    "actions": "Actions",
    "select": "Select",
    "selected": "Selected",
    "cancel": "Cancel"
  }
}
```

## Accessibility

- Modal has proper ARIA labels
- Table has `aria-label` for screen readers
- Keyboard navigation supported
- Focus management handled by HeroUI Modal component
- Disabled users cannot be selected

---

## UserCreateModal

A modal component for registering new users with complete form validation.

### Features

- **User Type Selection**: Choose between doctor or manager
- **Form Validation**: Client-side validation for all fields
- **Password Confirmation**: Ensures passwords match
- **Conditional Fields**: Shows specialty/bio fields for doctors only
- **Error Handling**: Displays both client and server validation errors
- **Auto-reset**: Clears form on successful submission

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Callback when modal is closed |
| `onSuccess` | `(user: UserEntity) => void` | Yes | - | Callback when user is successfully created |
| `defaultUserType` | `'doctor' \| 'manager'` | No | `'doctor'` | Default user type selection |

### Usage

#### Basic Usage

```tsx
import { useState } from 'react';
import { useDisclosure } from '@heroui/react';
import { UserCreateModal } from '@/pages/users/components';
import { UserEntity } from '@/models/users';

function MyComponent() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleUserCreated = (user: UserEntity) => {
    console.log('User created:', user);
    // Use the newly created user
  };

  return (
    <>
      <Button onPress={onOpen}>Register New User</Button>
      
      <UserCreateModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleUserCreated}
        defaultUserType="doctor"
      />
    </>
  );
}
```

#### Combined with UserSearchModal

```tsx
import { useState } from 'react';
import { useDisclosure, Button } from '@heroui/react';
import { UserSearchModal, UserCreateModal } from '@/pages/users/components';
import { UserEntity } from '@/models/users';
import { FiSearch, FiUserPlus } from 'react-icons/fi';

function UserSelectionComponent() {
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);

  const handleUserSelect = (user: UserEntity) => {
    setSelectedUser(user);
    console.log('Selected user:', user);
  };

  return (
    <div>
      {selectedUser ? (
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{selectedUser.full_name}</p>
            <p className="text-sm text-default-500">{selectedUser.email}</p>
          </div>
          <Button size="sm" variant="light" onPress={onSearchOpen}>
            Change
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="bordered"
            startContent={<FiSearch />}
            onPress={onSearchOpen}
            className="flex-1"
          >
            Select Existing User
          </Button>
          <Button
            color="primary"
            startContent={<FiUserPlus />}
            onPress={onCreateOpen}
          >
            Register New
          </Button>
        </div>
      )}

      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={onSearchClose}
        onSelect={handleUserSelect}
        selectedUserId={selectedUser?.id}
        userTypeFilter="doctor"
      />

      <UserCreateModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleUserSelect}
        defaultUserType="doctor"
      />
    </div>
  );
}
```

### Form Fields

#### Required Fields
- **Full Name**: User's complete name
- **Username**: Unique username for login
- **Email**: Valid email address
- **Password**: At least 8 characters
- **Confirm Password**: Must match password
- **User Type**: Doctor or Manager
- **Specialty**: Required only for doctors

#### Optional Fields
- **Phone**: Contact phone number
- **Bio**: Biography (for doctors only)
- **Language**: Preferred language (default: Arabic)

### Validation Rules

1. **Username**: Required, must be unique
2. **Email**: Required, must be valid email format, must be unique
3. **Full Name**: Required
4. **Password**: Required, minimum 8 characters
5. **Confirm Password**: Must match password field
6. **Specialty**: Required if user type is doctor
7. **Phone**: Optional, no format validation
8. **Bio**: Optional

### Error Handling

The component handles two types of errors:

1. **Client-side validation**: Immediate feedback as user fills the form
2. **Server-side validation**: API errors displayed below relevant fields or as a general error message

Example API error response:
```json
{
  "username": ["A user with that username already exists."],
  "email": ["This email is already in use."]
}
```

### API Requirements

The component uses the `usersApi` client which expects:

- `POST /api/users/` endpoint
- Request body matches `UserCreateInput` interface
- Returns created user matching `UserEntity` interface

Request format:
```typescript
{
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  language: 'ar' | 'en';
  password: string;
  is_active: boolean;
  is_staff: boolean;
  user_type: 'doctor' | 'manager';
  specialty?: string;
  bio?: string;
  groups: number[];
}
```

### Translation Keys

Additional translation keys for UserCreateModal:

```json
{
  "users": {
    "createNew": "Create New User",
    "createNewDesc": "Register a new user account",
    "createUser": "Create User",
    "fullName": "Full Name",
    "enterFullName": "Enter full name",
    "enterUsername": "Enter username",
    "enterEmail": "Enter email",
    "enterPhone": "Enter phone number",
    "password": "Password",
    "enterPassword": "Enter password",
    "confirmPassword": "Confirm Password",
    "confirmPasswordPlaceholder": "Re-enter password",
    "passwordHint": "At least 8 characters",
    "enterSpecialty": "Enter specialty",
    "enterBio": "Enter bio",
    "errors": {
      "usernameRequired": "Username is required",
      "emailRequired": "Email is required",
      "invalidEmail": "Invalid email format",
      "fullNameRequired": "Full name is required",
      "passwordRequired": "Password is required",
      "passwordTooShort": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match",
      "specialtyRequired": "Specialty is required for doctors"
    }
  },
  "languages": {
    "arabic": "Arabic",
    "english": "English"
  }
}
```

### Styling

- Size: `3xl` for good form visibility
- Scroll behavior: `inside` (scrollable content within modal)
- Form layout: Vertical with proper spacing
- Conditional rendering for doctor-specific fields
- Error messages in danger color
- Password fields with lock icons
