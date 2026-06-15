import { cookies } from "next/headers";
import { getWorkspaceData } from "../actions";
import { getWorkspaceModules } from "./setting/actions";
import { WorkspaceSidebar } from "./components/WorkspaceSidebar";
import { notFound } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  try {
    const [workspaceResult, modulesResult] = await Promise.all([
      getWorkspaceData(workspaceId),
      getWorkspaceModules(workspaceId)
    ]);

    const { workspace, channels, members, userRole } = workspaceResult;
    const modules = modulesResult.modules || [];

    return (
      <SidebarProvider defaultOpen={defaultOpen} className="!min-h-0 h-full overflow-hidden">
        <WorkspaceSidebar
          workspace={workspace}
          channels={channels}
          members={members}
          userRole={userRole}
          modules={modules}
        />
        <SidebarInset className="flex flex-col h-full overflow-hidden">
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-background z-10 w-full relative">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
            </div>
            {/* The redundant workspace name breadcrumb was removed here */}
          </header>
          <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  } catch (error) {
    console.error("Error loading workspace:", error);
    notFound();
  }
}
