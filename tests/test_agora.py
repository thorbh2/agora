"""
Tests for AGORA (direct runner). The AI grants reviewer is mocked.

Run with:  python -m pytest -v
"""

import json
from pathlib import Path

CONTRACT = str(Path(__file__).resolve().parents[1] / "contracts" / "agora.py")

GEN = 10 ** 18
PENDING, APPROVED, REJECTED = 0, 1, 2

CHARTER = "Fund open-source developer tooling for the GenLayer ecosystem."


def _setup(c, vm, steward, funding=20 * GEN, charter=CHARTER):
    vm.sender = steward
    vm.value = funding
    c.set_charter(charter)
    vm.value = 0


def _propose(c, vm, who, amount=5 * GEN, title="CLI for GenLayer", detail="A developer CLI."):
    vm.sender = who
    pid = c.propose(title, detail, str(amount))
    return pid


# ----------------------------------------------------------------- charter / treasury
def test_set_charter_and_fund(deploy, direct_vm, direct_alice):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice, funding=20 * GEN)
    assert c.get_charter() == CHARTER
    assert c.get_treasury() == str(20 * GEN)


def test_charter_set_once(deploy, direct_vm, direct_alice):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice)
    direct_vm.sender = direct_alice
    direct_vm.value = 0
    with direct_vm.expect_revert("already set"):
        c.set_charter("new charter")


def test_donate_grows_treasury(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice, funding=10 * GEN)
    direct_vm.sender = direct_bob
    direct_vm.value = 5 * GEN
    c.donate()
    direct_vm.value = 0
    assert c.get_treasury() == str(15 * GEN)


# ----------------------------------------------------------------- propose
def test_propose_adds(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice)
    pid = _propose(c, direct_vm, direct_bob, amount=5 * GEN)
    assert pid == 0
    p = c.get_proposal(0)
    assert p["status"] == PENDING
    assert p["amount"] == str(5 * GEN)


def test_propose_requires_amount(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice)
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("above zero"):
        c.propose("t", "d", "0")


# ----------------------------------------------------------------- review (mocked)
def test_review_approves_and_pays(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice, funding=20 * GEN)
    _propose(c, direct_vm, direct_bob, amount=5 * GEN)
    direct_vm.mock_llm(r"grants reviewer", json.dumps({"approve": True, "score": 88, "reason": "strong fit"}))
    direct_vm.sender = direct_bob
    c.review(0)
    p = c.get_proposal(0)
    assert p["status"] == APPROVED
    assert p["score"] == 88
    assert c.get_treasury() == str(15 * GEN)


def test_review_rejects(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice, funding=20 * GEN)
    _propose(c, direct_vm, direct_bob, amount=5 * GEN)
    direct_vm.mock_llm(r"grants reviewer", json.dumps({"approve": False, "score": 12, "reason": "off charter"}))
    c.review(0)
    p = c.get_proposal(0)
    assert p["status"] == REJECTED
    assert c.get_treasury() == str(20 * GEN)  # nothing paid


def test_review_rejects_when_over_budget(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice, funding=3 * GEN)
    _propose(c, direct_vm, direct_bob, amount=5 * GEN)  # asks more than treasury
    direct_vm.mock_llm(r"grants reviewer", json.dumps({"approve": True, "score": 90, "reason": "great but pricey"}))
    c.review(0)
    # approved by AI but treasury too small -> rejected, nothing paid
    assert c.get_proposal(0)["status"] == REJECTED
    assert c.get_treasury() == str(3 * GEN)


def test_cannot_review_twice(deploy, direct_vm, direct_alice, direct_bob):
    c = deploy(CONTRACT)
    _setup(c, direct_vm, direct_alice, funding=20 * GEN)
    _propose(c, direct_vm, direct_bob, amount=5 * GEN)
    direct_vm.mock_llm(r"grants reviewer", json.dumps({"approve": True, "score": 70, "reason": "ok"}))
    c.review(0)
    with direct_vm.expect_revert("already reviewed"):
        c.review(0)


def test_unknown_proposal_reverts(deploy, direct_vm):
    c = deploy(CONTRACT)
    with direct_vm.expect_revert("no such proposal"):
        c.get_proposal(0)
