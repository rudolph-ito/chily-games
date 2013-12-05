class ApplicationController < ActionController::Base
  protect_from_forgery

  def authority_forbidden(error)
    Rails.logger.warn(error.message)

    respond_to do |format|
      format.html { redirect_to root_path, notice: error.message }
      format.json { head 401 }
    end
  end
end
