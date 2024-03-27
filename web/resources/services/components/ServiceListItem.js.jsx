import React from "react";
import NumberFormat from "react-number-format";
//import toast from "react-hot-toast";
import ReactTooltip from "react-tooltip";

const ServiceListItem = ({
  data,
  dispatch,
  deleteService,
  handleServiceModal,
  index,
}) => {
  const handleDelete = (data) => {
    // Swal.fire({
    //   html: `Do you want to delete <b>${data.service}</b> service?`,
    //   icon: "warning",
    //   showCancelButton: true,
    //   confirmButtonColor: "#0DA79D",
    //   confirmButtonText: "Yes, delete it!",
    // }).then((result) => {
    //   if (result.isConfirmed) {
        dispatch(deleteService(data._id));
        // setTimeout(() => {
        //   Toast.fire({
        //     icon: 'info',
        //     title: `Please wait..`
        //   })
        // }, 700);
    //   }
    // });
  };
  return (
    <tr key={index} className="ic-font-13">
      <td className="p-p-6">{data.service}</td>
      <td className="p-p-6">{data.description}</td>
      <td className="p-text-center">
        <NumberFormat
          thousandsGroupStyle="thousand"
          value={data.price}
          prefix="$"
          decimalSeparator="."
          displayType="text"
          type="text"
          thousandSeparator={true}
          allowNegative={true}
          decimalScale={2}
          fixedDecimalScale={true}
          allowEmptyFormatting={true}
          allowLeadingZeros={true}
        />
      </td>
      <td className="p-text-center">
        <a
          data-tip
          data-for="edit"
          onClick={() => handleServiceModal("edit", data)}
        >
          <i
            className="fas fa-edit"
            title="Edit"
            style={{ marginRight: 10 }}
          ></i>
        </a>
        <ReactTooltip id="edit" place="top" effect="solid">
          <span>Edit</span>
        </ReactTooltip>
        <a data-tip data-for="delete" onClick={() => handleDelete(data)}>
          <i
            className="far fa-trash-alt"
            title="Delete"
            style={{ color: "red", marginRight: 10 }}
          ></i>
        </a>
        <ReactTooltip id="delete" place="top" effect="solid">
          <span>Delete</span>
        </ReactTooltip>

        {/* {data && index == 0 ? (
          <a data-tip data-for="create" onClick={() => handleServiceModal()}>
            <i className="fas fa-plus" title="Create"></i>
          </a>
        ) : <span>&nbsp;&nbsp;&nbsp;</span>}
        <ReactTooltip id="create" place="top" effect="solid">
          <span>Add service</span>
        </ReactTooltip> */}
      </td>
    </tr>
  );
};

ServiceListItem.propTypes = {};

export default ServiceListItem;
