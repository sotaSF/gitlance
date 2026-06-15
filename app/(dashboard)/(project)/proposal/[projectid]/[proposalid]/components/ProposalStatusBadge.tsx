import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProposalStatusBadgeProps {
  status: string;
  className?: string;
}

export default function ProposalStatusBadge({
  status,
  className,
}: ProposalStatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: string; className: string }> = {
    submitted: {
      label: "Submitted",
      variant: "default",
      className: "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
    },
    updated: {
      label: "Updated",
      variant: "default",
      className: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100",
    },
    withdrawn: {
      label: "Withdrawn",
      variant: "secondary",
      className: "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100",
    },
    accepted: {
      label: "Accepted",
      variant: "default",
      className: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
    },
    rejected: {
      label: "Rejected",
      variant: "destructive",
      className: "bg-red-100 text-red-800 border-red-300 hover:bg-red-100",
    },
    cancelled: {
      label: "Cancelled",
      variant: "secondary",
      className: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100",
    },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "outline",
    className: "",
  };

  return (
    <Badge
      variant={config.variant as any}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
