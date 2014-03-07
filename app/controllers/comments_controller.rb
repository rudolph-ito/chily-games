class CommentsController < ApplicationController
  before_filter :authenticate_user!
  before_filter :get_topic
  before_filter :build_comment
  before_filter :authorize

  def create
    @comment.update_attributes(comment_params)
    redirect_to @topic
  end

  protected

  def build_comment
    @comment = @topic.comments.build(user: current_user)
  end

  def get_topic
    @topic = Topic.find(params[:topic_id])
  end

  def authorize
    authorize_action_for @comment
  end

  def comment_params
    params.require(:comment).permit(:text)
  end
end
