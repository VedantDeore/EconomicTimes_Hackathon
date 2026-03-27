import json
from datetime import datetime, timezone
from bson import ObjectId

from app.engines.ai_client import ai_client
from app.engines.prompts.mf_prompts import MF_SYSTEM_PROMPT, MF_REBALANCE_PROMPT
from app.engines.calculators.xirr_calculator import calculate_xirr


class MFXRayService:
    def __init__(self, db):
        self.db = db

    async def process_statement(self, file, source: str, user_id: str):
        content = await file.read()

        # Parse based on source
        if source == "cams":
            from app.engines.parsers.cams_parser import parse_cams_statement
            holdings = await parse_cams_statement(content)
        elif source == "kfintech":
            from app.engines.parsers.kfintech_parser import parse_kfintech_statement
            holdings = await parse_kfintech_statement(content)
        else:
            holdings = []

        # Calculate portfolio metrics
        total_invested = sum(h.get("invested_amount", 0) for h in holdings)
        total_current = sum(h.get("current_value", 0) for h in holdings)
        total_returns = total_current - total_invested

        # Calculate XIRR per fund
        for holding in holdings:
            txns = holding.get("transactions", [])
            if txns:
                holding["xirr"] = calculate_xirr(txns, holding.get("current_value", 0))

        # Overlap analysis (simplified)
        overlap = self._analyze_overlap(holdings)
        overlap_pct = sum(o.get("total_weight_pct", 0) for o in overlap[:10]) / max(len(overlap), 1)

        # Expense ratio drag
        total_expense_drag = sum(
            h.get("expense_ratio", 0) * h.get("current_value", 0) / 100
            for h in holdings
        )

        portfolio_summary = {
            "total_invested": total_invested,
            "total_current_value": total_current,
            "total_returns": total_returns,
            "overall_xirr": ((total_current / max(total_invested, 1)) - 1) * 100,
            "expense_ratio_drag": total_expense_drag,
            "overlap_pct": overlap_pct,
        }

        # AI rebalancing
        risk_profile = "moderate"  # default
        profile = await self.db.financial_profiles.find_one({"user_id": ObjectId(user_id)})
        if profile:
            risk_profile = profile.get("risk_profile", "moderate")

        holdings_text = "\n".join(
            f"- {h['fund_name']} ({h.get('category', 'N/A')}): ₹{h.get('current_value', 0):,.0f}, "
            f"XIRR: {h.get('xirr', 0):.1f}%, ER: {h.get('expense_ratio', 0):.2f}%"
            for h in holdings
        )
        overlap_text = "\n".join(
            f"- {o['stock_name']}: in {len(o['funds_holding'])} funds, weight {o['total_weight_pct']:.1f}%"
            for o in overlap[:10]
        )

        prompt = MF_REBALANCE_PROMPT.format(
            total_invested=total_invested,
            current_value=total_current,
            overall_xirr=portfolio_summary["overall_xirr"],
            expense_drag=portfolio_summary["expense_ratio_drag"],
            overlap_pct=overlap_pct,
            holdings_text=holdings_text or "No holdings parsed",
            overlap_text=overlap_text or "No overlap detected",
            risk_profile=risk_profile,
        )
        ai_response = await ai_client.generate_json(prompt, MF_SYSTEM_PROMPT)

        try:
            ai_data = json.loads(ai_response)
            rebalancing = ai_data.get("rebalancing_suggestions", [])
            ai_summary = ai_data.get("ai_summary", "")
        except (json.JSONDecodeError, Exception):
            rebalancing = []
            ai_summary = "Portfolio analysis complete."

        # Save
        investment_doc = {
            "user_id": ObjectId(user_id),
            "source": source,
            "holdings": holdings,
            "portfolio_summary": portfolio_summary,
            "overlap_analysis": overlap,
            "rebalancing_plan": {"generated_at": datetime.now(timezone.utc), "suggestions": rebalancing},
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        result = await self.db.investments.insert_one(investment_doc)

        return {
            "id": str(result.inserted_id),
            "user_id": user_id,
            "source": source,
            "holdings": holdings,
            "portfolio_summary": portfolio_summary,
            "overlap_analysis": overlap,
            "rebalancing_suggestions": rebalancing,
            "ai_summary": ai_summary,
        }

    def _analyze_overlap(self, holdings):
        """Simplified overlap analysis based on fund categories."""
        category_map = {}
        for h in holdings:
            cat = h.get("category", "unknown")
            if cat not in category_map:
                category_map[cat] = []
            category_map[cat].append(h["fund_name"])

        overlap = []
        for cat, funds in category_map.items():
            if len(funds) > 1:
                overlap.append({
                    "stock_name": f"{cat} category overlap",
                    "funds_holding": funds,
                    "total_weight_pct": len(funds) * 10,
                })
        return overlap
