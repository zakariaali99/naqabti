from django.core.exceptions import ValidationError
from django.test import TestCase

from niqabaty.models import Branch
from .factories import create_branch, create_manager


class BranchModelTests(TestCase):
    """Tests for Branch model business rules and helper methods."""

    def test_branch_manager_fk_is_set(self):
        """
        Verify that a branch can be assigned a manager via the ForeignKey relationship.
        This ensures the manager field correctly stores the user ID.
        """
        manager = create_manager(username="manager_fk")
        branch = create_branch(name="Main", prefix="MAIN", manager=manager)

        self.assertEqual(branch.manager_id, manager.id)

    def test_branch_cannot_be_its_own_parent(self):
        """
        Ensure a branch cannot reference itself as its own parent.
        This prevents circular self-references in the branch hierarchy.
        """
        branch = create_branch(name="Main", prefix="SELF")
        branch.parent = branch

        with self.assertRaises(ValidationError):
            branch.clean()

    def test_branch_depth_is_limited_to_two_levels(self):
        """
        Validate that branch hierarchy depth is limited to 2 levels (root + child).
        Attempting to create a grandchild (3rd level) should raise a ValidationError.
        """
        root = create_branch(name="Root", prefix="ROOT")
        child = create_branch(name="Child", prefix="CHLD", parent=root)
        grandchild = Branch(name="Grand", prefix="GRND", parent=child)

        with self.assertRaises(ValidationError):
            grandchild.clean()

    def test_get_ancestors_returns_parent_chain(self):
        """
        Test that the get_ancestors() helper returns the correct parent chain.
        For a child branch, it should return a list containing its immediate parent.
        """
        root = create_branch(name="Root", prefix="ANC1")
        child = create_branch(name="Child", prefix="ANC2", parent=root)

        ancestors = child.get_ancestors()

        self.assertEqual(ancestors, [root])

