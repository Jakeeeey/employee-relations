import { NextResponse } from "next/server";
import { schedulingService, taskService } from "../../../../modules/er/tasks/services/taskService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Ensure requests come from an authorized cron trigger
  const authHeader = request.headers.get('authorization');
  // Simple check for demonstration; in production, use a secure secret
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const rules = await schedulingService.fetchAllRules();
    let tasksCreated = 0;
    
    // In a real scenario, use a library like 'cron-parser' to evaluate `cron_expression` 
    // against the current time. For this demo, we'll assume any 'Active' rule should spawn a task if called.
    for (const rule of rules) {
      // Spawn new task
      await taskService.create({
        ...rule.task_template,
        status: "Pending",
        user_id: rule.user_id,
        // deadline: ... could be calculated based on cadence
      });

      // Update rule last_run
      await schedulingService.updateRule(rule.id, { last_run: new Date().toISOString() });
      tasksCreated++;
    }

    return NextResponse.json({ message: `Cron executed successfully. ${tasksCreated} tasks created.` }, { status: 200 });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ message: "Failed to run cron" }, { status: 500 });
  }
}
