"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TaskComment } from "@/types/aufgaben";
import { formatCommentDate, newCommentId } from "@/components/aufgaben/task-detail/utils";

type TaskCommentsSectionProps = {
	comments: TaskComment[];
	newComment: string;
	writeEnabled: boolean;
	canAddComment: boolean;
	onNewCommentChange: (value: string) => void;
	onAddComment: (comment: TaskComment) => void;
	currentUser: { id: string; name?: string | null; email: string } | null;
};

export function TaskCommentsSection({
	comments,
	newComment,
	writeEnabled,
	canAddComment,
	onNewCommentChange,
	onAddComment,
	currentUser,
}: TaskCommentsSectionProps) {
	const handleAdd = () => {
		const text = newComment.trim();
		if (!text || !currentUser) return;
		onAddComment({
			id: newCommentId(),
			authorId: currentUser.id,
			authorName: currentUser.name?.trim() || currentUser.email,
			text,
			createdAt: new Date().toISOString(),
		});
		onNewCommentChange("");
	};

	return (
		<>
			<Separator />
			<section className="space-y-4">
				<div className="flex items-center gap-2">
					<MessageSquare className="size-4 text-muted-foreground" />
					<h3 className="font-medium">Kommentare</h3>
					<Badge variant="secondary" className="text-xs">
						{comments.length}
					</Badge>
				</div>

				{comments.length === 0 ? (
					<p className="text-sm text-muted-foreground">Noch keine Kommentare.</p>
				) : (
					<ul className="space-y-3">
						{comments.map((comment) => (
							<li
								key={comment.id}
								className="rounded-lg border bg-muted/30 px-3 py-2.5"
							>
								<div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
									<span className="font-medium text-foreground">
										{comment.authorName}
									</span>
									<time dateTime={comment.createdAt}>
										{formatCommentDate(comment.createdAt)}
									</time>
								</div>
								<p className="text-sm whitespace-pre-wrap">{comment.text}</p>
							</li>
						))}
					</ul>
				)}

				{writeEnabled ? (
					<div className="space-y-2">
						<Textarea
							value={newComment}
							onChange={(e) => onNewCommentChange(e.target.value)}
							rows={2}
							placeholder="Kommentar schreiben…"
							onKeyDown={(e) => {
								if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
									e.preventDefault();
									handleAdd();
								}
							}}
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onClick={handleAdd}
							disabled={!newComment.trim() || !canAddComment}
						>
							Kommentar hinzufügen
						</Button>
					</div>
				) : null}
			</section>
		</>
	);
}
