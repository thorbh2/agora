# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
AGORA - An AI-Moderated Grants Treasury
=======================================
A community pools GEN into a treasury under a written charter. Anyone submits a
funding proposal with a requested amount. Instead of a token vote, the contract
itself reads each proposal against the charter and the validator set agrees
(Equivalence Principle) whether it deserves funding and how strongly it aligns.
Approved proposals are paid from the treasury, capped by what remains.

Lifecycle for a proposal:
    PENDING   -> submitted, awaiting AI review
    APPROVED  -> aligned with the charter, paid from treasury
    REJECTED  -> not aligned, nothing paid
"""

from genlayer import *
from dataclasses import dataclass
import json
import typing


STATUS_PENDING = 0
STATUS_APPROVED = 1
STATUS_REJECTED = 2


@allow_storage
@dataclass
class Proposal:
    proposer: Address
    title: str
    detail: str
    amount: u256
    status: u8
    score: u8        # 0..100 alignment score from the jury
    rationale: str


class Agora(gl.Contract):
    charter: str
    treasury: u256
    proposals: DynArray[Proposal]

    def __init__(self) -> None:
        self.charter = ""
        self.treasury = u256(0)

    @gl.public.write.payable
    def set_charter(self, charter: str) -> None:
        """Set or update the charter. Only allowed while empty (first writer
        becomes the steward) or by adding text on top of funding."""
        if len(self.charter.strip()) != 0:
            raise gl.vm.UserError("charter already set")
        if len(charter.strip()) == 0:
            raise gl.vm.UserError("charter text is required")
        self.charter = charter
        self.treasury = self.treasury + gl.message.value

    @gl.public.write.payable
    def donate(self) -> None:
        """Add GEN to the treasury."""
        if gl.message.value == u256(0):
            raise gl.vm.UserError("send GEN to donate")
        self.treasury = self.treasury + gl.message.value

    @gl.public.write
    def propose(self, title: str, detail: str, amount_wei: str) -> int:
        if len(title.strip()) == 0:
            raise gl.vm.UserError("a title is required")
        if len(detail.strip()) == 0:
            raise gl.vm.UserError("proposal detail is required")
        try:
            amount = u256(int(amount_wei))
        except (ValueError, TypeError):
            raise gl.vm.UserError("amount must be an integer (wei)")
        if amount == u256(0):
            raise gl.vm.UserError("requested amount must be above zero")
        p = self.proposals.append_new_get()
        p.proposer = gl.message.sender_address
        p.title = title
        p.detail = detail
        p.amount = amount
        p.status = u8(STATUS_PENDING)
        p.score = u8(0)
        p.rationale = ""
        return len(self.proposals) - 1

    @gl.public.write
    def review(self, proposal_id: int) -> None:
        """The contract reads the proposal against the charter and the validator
        set agrees on whether to fund it."""
        p = self._get(proposal_id)
        if p.status != STATUS_PENDING:
            raise gl.vm.UserError("proposal already reviewed")

        charter = self.charter
        title = p.title
        detail = p.detail
        amount_gen = int(p.amount) // (10 ** 18)

        def leader_fn() -> str:
            prompt = (
                f"Treasury charter (the rules for what to fund):\n{charter}\n\n"
                f"Proposal title: {title}\n"
                f"Proposal detail: {detail}\n"
                f"Requested amount: {amount_gen} GEN\n\n"
                "As an impartial grants reviewer, decide if this proposal aligns "
                "with the charter and deserves funding. Reply with ONLY JSON: "
                '{"approve": true, "score": 0-100, "reason": "..."} where score '
                "is how strongly it aligns. Use approve:false for misaligned or "
                "wasteful proposals."
            )
            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leader_res) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            return self._decision_of(leader_res.calldata)[0] == self._decision_of(leader_fn())[0]

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        approve, score, reason = self._decision_of(result)
        p.score = u8(max(0, min(100, score)))
        p.rationale = reason[:400]

        if approve and p.amount <= self.treasury:
            p.status = u8(STATUS_APPROVED)
            self.treasury = self.treasury - p.amount
            self._pay(p.proposer, p.amount)
        else:
            p.status = u8(STATUS_REJECTED)

    # ------------------------------------------------------------------ views
    @gl.public.view
    def get_charter(self) -> str:
        return self.charter

    @gl.public.view
    def get_treasury(self) -> str:
        return str(self.treasury)

    @gl.public.view
    def get_proposal_count(self) -> int:
        return len(self.proposals)

    @gl.public.view
    def get_proposal(self, proposal_id: int) -> dict:
        p = self._get(proposal_id)
        return {
            "proposer": p.proposer.as_hex,
            "title": p.title,
            "detail": p.detail,
            "amount": str(p.amount),
            "status": int(p.status),
            "score": int(p.score),
            "rationale": p.rationale,
        }

    # -------------------------------------------------------------- internals
    def _get(self, proposal_id: int) -> Proposal:
        if proposal_id < 0 or proposal_id >= len(self.proposals):
            raise gl.vm.UserError("no such proposal")
        return self.proposals[proposal_id]

    def _decision_of(self, result: typing.Any) -> tuple:
        data = result
        if isinstance(data, str):
            data = self._extract_json(data)
        if not isinstance(data, dict):
            return (False, 0, "")
        raw = data.get("approve", False)
        approve = raw is True or (isinstance(raw, str) and raw.strip().lower() == "true")
        try:
            score = int(data.get("score", 0))
        except (ValueError, TypeError):
            score = 0
        reason = str(data.get("reason", ""))
        return (approve, score, reason)

    def _extract_json(self, text: str) -> typing.Any:
        try:
            return json.loads(text)
        except (ValueError, TypeError):
            pass
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except (ValueError, TypeError):
                return None
        return None

    def _pay(self, recipient: Address, amount: u256) -> None:
        if amount == u256(0):
            return
        _Payee(recipient).emit_transfer(value=amount)


@gl.evm.contract_interface
class _Payee:
    class View:
        pass

    class Write:
        pass
