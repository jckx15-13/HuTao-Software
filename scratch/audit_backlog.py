import re
import os

def main():
    master_prompt_path = r"c:\Users\jaron\OneDrive - Ministry of Education (M365 T&L)\Documents\silver-wolf-vi\docs\development_logs\PROJECT_ANALYSIS_MASTER_PROMPT.md"
    artifact_dir = r"C:\Users\jaron\.gemini\antigravity\brain\3044dd3b-6f4b-48ed-ae61-99e4f097932e"
    report_path = os.path.join(artifact_dir, "backlog_audit_report.md")

    if not os.path.exists(master_prompt_path):
        print(f"Error: Master prompt file not found at {master_prompt_path}")
        return

    print("Reading master prompt file...")
    with open(master_prompt_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the backlog section
    backlog_start = content.find("## The 1000 Improvement Backlog")
    if backlog_start == -1:
        print("Error: Could not find backlog section")
        return

    backlog_content = content[backlog_start:]
    
    # Regex to match backlog items: e.g. "1. Threat model: Description in target."
    pattern = re.compile(r"^(\d+)\.\s+([^:]+):\s+(.*?)\s+in\s+[`\"']?([^`\"'\n]+)[`\"']?\.$", re.MULTILINE)
    matches = pattern.findall(backlog_content)

    print(f"Regex matched {len(matches)} items.")

    # If regex was too strict, let's use a simpler one
    if len(matches) < 950:
        print("Retrying with broader regex...")
        # Broad match for any line starting with a number
        pattern_broad = re.compile(r"^(\d+)\.\s+([^:]+):\s+(.*)$", re.MULTILINE)
        matches = pattern_broad.findall(backlog_content)
        print(f"Broad regex matched {len(matches)} items.")

    if not matches:
        print("Error: No backlog items found.")
        return

    print("Generating report...")
    report_content = []
    report_content.append("# Backlog Audit Report - 1000 Unrecovered Items\n")
    report_content.append("This report lists the backlog of improvements identified in the codebase analysis. These items are currently **Pending Restoration / Unimplemented** in the unified spatial explorer shell.\n")
    report_content.append("| ID | Category | Description / Surface | Status |")
    report_content.append("|---|---|---|---|")

    count = 0
    for match in matches[:1000]:
        num = match[0]
        category = match[1].strip()
        details = match[2].strip()
        
        # Format for table row
        # Clean up any pipes to avoid breaking markdown table
        details_clean = details.replace("|", "\\|")
        report_content.append(f"| {num} | {category} | {details_clean} | `Pending Restoration` |")
        count += 1

    report_content.append(f"\nTotal audited items: {count}")

    print(f"Writing report to {report_path}...")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_content))
    
    print("Success!")

if __name__ == "__main__":
    main()
