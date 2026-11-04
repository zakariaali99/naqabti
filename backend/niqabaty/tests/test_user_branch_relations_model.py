from django.test import TestCase

from .factories import create_branch, create_doctor, create_manager


class UserBranchRelationsModelTests(TestCase):
    """Tests for User-Branch relationship behavior at the model level."""

    def test_doctor_can_be_linked_to_branch(self):
        """
        Verify that a doctor user can be linked to a branch via the ManyToMany relationship.
        This ensures the User.branches field correctly stores branch associations.
        """
        doctor = create_doctor(username="doctor_rel_1")
        branch = create_branch(name="A", prefix="UBA")

        doctor.branches.add(branch)

        self.assertTrue(doctor.branches.filter(id=branch.id).exists())

    def test_manager_reverse_relation_managed_branches_works(self):
        """
        Verify that the reverse relation Branch.manager provides access to branches managed by a user.
        This ensures the related_name='managed_branches' works correctly.
        """
        manager = create_manager(username="manager_rel_1")
        branch = create_branch(name="Managed", prefix="UMB", manager=manager)

        self.assertTrue(manager.managed_branches.filter(id=branch.id).exists())

