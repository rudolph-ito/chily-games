class Api::VariantsController < ApplicationController
  before_filter :get_variant

  def preview
    @preview = @variant.preview(params)
  end

  protected

  def get_variant
    @variant = Variant.find(params[:id])
  end
end
