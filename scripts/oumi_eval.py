#!/usr/bin/env python3
"""
MetaMorph AI - Oumi-Inspired Code Evaluation System
Iron Intelligence Award - Using AI for code quality evaluation

This script performs sophisticated static analysis to evaluate code quality.
In a production system, this would integrate with Oumi's fine-tuned models.
"""

import ast
import sys
import os
from pathlib import Path

def analyze_code_quality(file_path: str) -> dict:
    """
    Perform comprehensive code quality analysis.
    Returns a dict with score and feedback.
    """
    
    print("🚀 Initializing MetaMorph Oumi Evaluation Engine...")
    print(f"📂 Target file: {file_path}")
    print("━" * 60)
    
    try:
        with open(file_path, 'r') as f:
            code_content = f.read()
    except FileNotFoundError:
        return {
            'score': 0,
            'passed': False,
            'feedback': f'File not found: {file_path}'
        }
    
    # Initialize scoring
    score = 100
    issues = []
    suggestions = []
    
    # Check 1: Memory leak patterns (JavaScript specific)
    print("🔍 Analyzing memory management patterns...")
    
    memory_leak_indicators = [
        'setInterval',
        'setTimeout', 
        'addEventListener',
        'on(',
        '.on('
    ]
    
    cleanup_indicators = [
        'clearInterval',
        'clearTimeout',
        'removeEventListener',
        'removeListener',
        '.clear()',
        'stop(',
        'cleanup(',
        'destroy('
    ]
    
    has_leak_potential = any(indicator in code_content for indicator in memory_leak_indicators)
    has_cleanup = any(indicator in code_content for indicator in cleanup_indicators)
    
    if has_leak_potential and not has_cleanup:
        score -= 30
        issues.append("❌ Memory leak risk: Timers/listeners created without cleanup")
        suggestions.append("Add cleanup methods to remove listeners and clear intervals")
    elif has_leak_potential and has_cleanup:
        print("  ✅ Proper cleanup methods detected")
        
    # Check 2: Blocking operations
    print("🔍 Checking for blocking operations...")
    
    blocking_patterns = [
        'readFileSync',
        'writeFileSync',
        'execSync',
        '/dev/random'
    ]
    
    has_blocking = any(pattern in code_content for pattern in blocking_patterns)
    
    if has_blocking:
        score -= 25
        issues.append("❌ Blocking synchronous operations detected")
        suggestions.append("Replace synchronous operations with async alternatives")
    else:
        print("  ✅ No blocking operations found")
        
    # Check 3: Error handling
    print("🔍 Analyzing error handling...")
    
    has_unhandled_promises = 'Promise.reject' in code_content and 'catch' not in code_content
    
    if has_unhandled_promises:
        score -= 15
        issues.append("❌ Unhandled promise rejections")
        suggestions.append("Add .catch() handlers or try/catch blocks")
    else:
        print("  ✅ Error handling looks good")
        
    # Check 4: Code structure
    print("🔍 Evaluating code structure...")
    
    has_cleanup_method = 'stop(' in code_content or 'cleanup(' in code_content or 'destroy(' in code_content
    has_constructor = 'constructor(' in code_content or 'function ' in code_content
    
    if has_constructor and not has_cleanup_method:
        score -= 10
        issues.append("⚠️ No cleanup/destroy method for resource management")
        suggestions.append("Implement lifecycle management methods")
    else:
        print("  ✅ Lifecycle management present")
        
    # Check 5: Cache growth
    print("🔍 Checking for unbounded data growth...")
    
    has_cache = '.set(' in code_content or 'push(' in code_content
    has_size_limit = 'size' in code_content or 'length' in code_content or 'limit' in code_content
    
    if has_cache and not has_size_limit:
        score -= 10
        issues.append("⚠️ Data structures may grow unbounded")
        suggestions.append("Implement size limits or LRU eviction")
    else:
        print("  ✅ Data growth appears controlled")
    
    # Check 6: Documentation
    print("🔍 Checking documentation quality...")
    
    has_comments = '//' in code_content or '/*' in code_content
    comment_ratio = code_content.count('//') / max(code_content.count('\n'), 1)
    
    if not has_comments or comment_ratio < 0.05:
        score -= 5
        suggestions.append("Add more inline documentation")
    else:
        print("  ✅ Documentation present")
    
    # Ensure score is within bounds
    score = max(0, min(100, score))
    
    print("━" * 60)
    print(f"🎯 OUMI EVALUATION SCORE: {score}/100")
    print("━" * 60)
    
    # Print detailed feedback
    if issues:
        print("\n❌ CRITICAL ISSUES:")
        for issue in issues:
            print(f"  {issue}")
    
    if suggestions:
        print("\n💡 SUGGESTIONS:")
        for suggestion in suggestions:
            print(f"  • {suggestion}")
    
    passed = score >= 80
    
    if passed:
        print("\n✅ CODE QUALITY CHECK: PASSED")
        print("   Code meets MetaMorph quality standards")
    else:
        print("\n❌ CODE QUALITY CHECK: FAILED")
        print(f"   Score {score}/100 is below threshold of 80/100")
        print("   Agent should refine the code and re-evaluate")
    
    print("━" * 60)
    
    return {
        'score': score,
        'passed': passed,
        'issues': issues,
        'suggestions': suggestions
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 oumi_eval.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = analyze_code_quality(file_path)
    
    # Exit with appropriate code
    sys.exit(0 if result['passed'] else 1)

if __name__ == '__main__':
    main()
